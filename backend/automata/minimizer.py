"""
DFA Minimization Algorithm using Hopcroft / Moore Partition Refinement.
Features:
  - Prunes unreachable states
  - Preserves token distinction: states accepting different token types are never merged
  - Partitions states iteratively based on transition signatures
  - Computes exact before/after state counts and reduction statistics
"""

from typing import Dict, List, Set, Tuple, Optional, Any, FrozenSet
from .dfa import DFA, DFAState, format_char_set_label

class DFAMinimizer:
    def __init__(self, dfa: DFA):
        self.original_dfa = dfa

    def get_reachable_states(self) -> Set[int]:
        """Finds all states reachable from start_state_id."""
        visited: Set[int] = set()
        queue = [self.original_dfa.start_state_id]
        if self.original_dfa.start_state_id in self.original_dfa.states:
            visited.add(self.original_dfa.start_state_id)

        while queue:
            current = queue.pop(0)
            state = self.original_dfa.states.get(current)
            if not state:
                continue
            for next_state_id in state.transitions.values():
                if next_state_id not in visited and next_state_id in self.original_dfa.states:
                    visited.add(next_state_id)
                    queue.append(next_state_id)

        return visited

    def minimize(self) -> Tuple[DFA, Dict[str, Any]]:
        reachable = self.get_reachable_states()
        orig_count = len(self.original_dfa.states)

        # Filter out unreachable states
        filtered_states = {s_id: self.original_dfa.states[s_id] for s_id in reachable}
        if not filtered_states:
            # Empty or trivial
            return self.original_dfa, {
                "original_states": orig_count,
                "minimized_states": 0,
                "reduction_percentage": 0.0,
                "states_removed": orig_count
            }

        # Step 1: Initial Partitioning
        # Non-accepting states go to one bucket.
        # Accepting states are grouped strictly by their (token_name, token_id).
        initial_groups: Dict[Any, Set[int]] = {}
        for s_id, state in filtered_states.items():
            if not state.is_accept:
                key = ("__NON_ACCEPT__", None)
            else:
                key = (state.token_name, state.token_id)
            if key not in initial_groups:
                initial_groups[key] = set()
            initial_groups[key].add(s_id)

        partitions: List[Set[int]] = list(initial_groups.values())

        # Step 2: Iterative Partition Refinement
        # A state's behavior is characterized by which partition each transition lands in
        while True:
            new_partitions: List[Set[int]] = []
            partition_changed = False

            # Create state -> partition_idx lookup
            state_to_part: Dict[int, int] = {}
            for p_idx, part in enumerate(partitions):
                for s_id in part:
                    state_to_part[s_id] = p_idx

            for part in partitions:
                if len(part) <= 1:
                    new_partitions.append(part)
                    continue

                # Group states in `part` by transition destination partitions
                sub_groups: Dict[Tuple, Set[int]] = {}
                for s_id in part:
                    state = filtered_states[s_id]
                    # Signature: sorted tuple of (char, target_part_idx)
                    sig_list = []
                    for ch, tgt_id in sorted(state.transitions.items()):
                        # If target state is reachable
                        tgt_part = state_to_part.get(tgt_id, -1)
                        sig_list.append((ch, tgt_part))
                    signature = tuple(sig_list)

                    if signature not in sub_groups:
                        sub_groups[signature] = set()
                    sub_groups[signature].add(s_id)

                if len(sub_groups) > 1:
                    partition_changed = True

                for sg in sub_groups.values():
                    new_partitions.append(sg)

            partitions = new_partitions
            if not partition_changed:
                break

        # Step 3: Construct Minimized DFA
        min_dfa = DFA()
        min_dfa.alphabet = self.original_dfa.alphabet

        # Map each old state to its new group index
        old_to_new_id: Dict[int, int] = {}
        # Ensure the group containing original start state gets ID 0
        orig_start = self.original_dfa.start_state_id
        start_part_idx = 0
        for p_idx, part in enumerate(partitions):
            if orig_start in part:
                start_part_idx = p_idx
                break

        # Reorder partitions so start state group is first (ID 0)
        ordered_partitions = [partitions[start_part_idx]] + [
            p for i, p in enumerate(partitions) if i != start_part_idx
        ]

        for new_id, part in enumerate(ordered_partitions):
            for old_id in part:
                old_to_new_id[old_id] = new_id

        # Build each new DFAState
        for new_id, part in enumerate(ordered_partitions):
            # Take representative state
            rep_id = next(iter(part))
            rep_state = filtered_states[rep_id]

            # Merge NFA states for transparency
            merged_nfa_states = set()
            candidate_tokens_merged = []
            seen_cand = set()
            for old_id in part:
                merged_nfa_states.update(filtered_states[old_id].nfa_states)
                for cand in filtered_states[old_id].candidate_tokens:
                    c_key = (cand["token_name"], cand["token_id"])
                    if c_key not in seen_cand:
                        seen_cand.add(c_key)
                        candidate_tokens_merged.append(cand)

            is_start = (new_id == 0)
            is_accept = rep_state.is_accept

            new_state = DFAState(
                id=new_id,
                nfa_states=frozenset(merged_nfa_states),
                is_start=is_start,
                is_accept=is_accept,
                token_name=rep_state.token_name,
                token_id=rep_state.token_id,
                priority=rep_state.priority,
                candidate_tokens=candidate_tokens_merged
            )

            # Transitions for this new state
            for ch, tgt_old in rep_state.transitions.items():
                if tgt_old in old_to_new_id:
                    new_state.transitions[ch] = old_to_new_id[tgt_old]

            min_dfa.add_state(new_state)

        min_dfa.start_state_id = 0

        min_count = len(min_dfa.states)
        reduction_pct = 0.0
        if orig_count > 0:
            reduction_pct = round(((orig_count - min_count) / orig_count) * 100, 2)

        stats = {
            "original_states": orig_count,
            "minimized_states": min_count,
            "reduction_percentage": max(0.0, reduction_pct),
            "states_removed": max(0, orig_count - min_count),
            "original_reachable": len(reachable)
        }

        return min_dfa, stats


def minimize_dfa(dfa: DFA) -> Tuple[DFA, Dict[str, Any]]:
    minimizer = DFAMinimizer(dfa)
    return minimizer.minimize()
