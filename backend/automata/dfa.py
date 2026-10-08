"""
Subset Construction Algorithm (NFA -> DFA).
Implements:
  - ε-closure calculation
  - Move(T, a) computation
  - Deterministic state set generation
  - Alphabet partitioning and human-readable transition labeling
  - Priority-based token conflict resolution for accepting sets
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple, Any, FrozenSet, Union
import string
from .nfa import NFA, NFATransition

@dataclass
class DFATransition:
    from_state: int
    to_state: int
    characters: Set[str]
    display_label: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_state": self.from_state,
            "to_state": self.to_state,
            "display_label": self.display_label,
            "char_count": len(self.characters)
        }


@dataclass
class DFAState:
    id: int
    nfa_states: FrozenSet[int]
    is_start: bool = False
    is_accept: bool = False
    token_name: Optional[str] = None
    token_id: Optional[int] = None
    priority: Optional[int] = None
    candidate_tokens: List[Dict[str, Any]] = field(default_factory=list)
    # transition lookup: char -> next_state_id
    transitions: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nfa_states": sorted(list(self.nfa_states)),
            "is_start": self.is_start,
            "is_accept": self.is_accept,
            "token_name": self.token_name,
            "token_id": self.token_id,
            "priority": self.priority,
            "candidate_tokens": self.candidate_tokens
        }


class DFA:
    def __init__(self):
        self.states: Dict[int, DFAState] = {}
        self.start_state_id: int = 0
        self.alphabet: Set[str] = set()

    def add_state(self, state: DFAState) -> None:
        self.states[state.id] = state

    def get_state(self, state_id: int) -> Optional[DFAState]:
        return self.states.get(state_id)

    def to_dict(self) -> Dict[str, Any]:
        # Formulate transitions list and grouped transitions
        transitions_list: List[Dict[str, Any]] = []
        transition_table: List[Dict[str, Any]] = []

        for s_id in sorted(self.states.keys()):
            state = self.states[s_id]
            # Group characters going to the same target state
            target_to_chars: Dict[int, Set[str]] = {}
            for ch, target in state.transitions.items():
                if target not in target_to_chars:
                    target_to_chars[target] = set()
                target_to_chars[target].add(ch)

            state_transitions = []
            for target, chars in sorted(target_to_chars.items()):
                label = format_char_set_label(chars)
                transitions_list.append({
                    "from_state": s_id,
                    "to_state": target,
                    "display_label": label,
                    "characters": sorted(list(chars))
                })
                state_transitions.append({
                    "to_state": target,
                    "display_label": label,
                    "sample_chars": sorted(list(chars))[:10]
                })

            transition_table.append({
                "state_id": s_id,
                "nfa_states": sorted(list(state.nfa_states)),
                "is_start": state.is_start,
                "is_accept": state.is_accept,
                "token_name": state.token_name,
                "token_id": state.token_id,
                "priority": state.priority,
                "candidate_tokens": state.candidate_tokens,
                "transitions": state_transitions
            })

        accept_states = [
            s.to_dict() for s in self.states.values() if s.is_accept
        ]

        return {
            "total_states": len(self.states),
            "start_state_id": self.start_state_id,
            "states": [s.to_dict() for s in sorted(self.states.values(), key=lambda x: x.id)],
            "accept_states": accept_states,
            "transitions": transitions_list,
            "transition_table": transition_table,
            "alphabet_size": len(self.alphabet)
        }


def format_char_set_label(chars: Set[str]) -> str:
    """Formats a set of characters into an intuitive label like [0-9], [a-z], etc."""
    digits = set(string.digits)
    letters_lower = set(string.ascii_lowercase)
    letters_upper = set(string.ascii_uppercase)
    ws = set(" \t\r\n")

    if chars == digits:
        return "[0-9]"
    if chars == letters_lower:
        return "[a-z]"
    if chars == letters_upper:
        return "[A-Z]"
    if chars == letters_lower | letters_upper:
        return "[a-zA-Z]"
    if chars == letters_lower | letters_upper | set("_"):
        return "[a-zA-Z_]"
    if chars == letters_lower | letters_upper | digits | set("_"):
        return "\\w"
    if chars == ws:
        return "\\s"
    if chars == set(" "):
        return "␣"
    if chars == set("\n"):
        return "\\n"
    if chars == set("\t"):
        return "\\t"

    if len(chars) == 1:
        c = next(iter(chars))
        if c == " ":
            return "␣"
        if c == "\n":
            return "\\n"
        if c == "\t":
            return "\\t"
        return c

    # Sort characters and detect ranges
    sorted_codes = sorted([ord(c) for c in chars])
    ranges = []
    i = 0
    while i < len(sorted_codes):
        start = sorted_codes[i]
        end = start
        while i + 1 < len(sorted_codes) and sorted_codes[i + 1] == end + 1:
            end = sorted_codes[i + 1]
            i += 1
        if end - start >= 2:
            ranges.append(f"{chr(start)}-{chr(end)}")
        elif end - start == 1:
            ranges.append(f"{chr(start)}{chr(end)}")
        else:
            c = chr(start)
            ranges.append("␣" if c == " " else "\\n" if c == "\n" else "\\t" if c == "\t" else c)
        i += 1

    label = "".join(ranges)
    if len(label) > 16:
        label = label[:14] + "..."
    return f"[{label}]"


def epsilon_closure(nfa: NFA, state_set: Union[Set[int], FrozenSet[int]]) -> FrozenSet[int]:
    """Computes the ε-closure of a set of NFA states."""
    closure = set(state_set)
    stack = list(state_set)

    while stack:
        current = stack.pop()
        for trans in nfa.get_transitions_from(current):
            if trans.is_epsilon and trans.to_state not in closure:
                closure.add(trans.to_state)
                stack.append(trans.to_state)

    return frozenset(closure)


def nfa_move(nfa: NFA, state_set: Union[Set[int], FrozenSet[int]], char: str) -> FrozenSet[int]:
    """Computes move(state_set, char): NFA states reachable from state_set on symbol char."""
    target_states: Set[int] = set()
    for s in state_set:
        for trans in nfa.get_transitions_from(s):
            if trans.matches(char):
                target_states.add(trans.to_state)
    return frozenset(target_states)


def extract_active_alphabet(nfa: NFA) -> Set[str]:
    """Extracts all characters that could trigger transitions in the NFA."""
    chars: Set[str] = set()
    for trans in nfa.transitions:
        if trans.is_epsilon:
            continue
        if isinstance(trans.symbol, str):
            chars.add(trans.symbol)
        elif isinstance(trans.symbol, frozenset):
            chars.update(trans.symbol)
    
    # Also include standard printable ASCII plus tab and newline if not present
    chars.update(" \t\n")
    chars.update(string.ascii_letters)
    chars.update(string.digits)
    chars.update("+-*/=<>!&|^%.,;:()[]{}\"'`~@#$")
    return chars


def subset_construction(nfa: NFA) -> DFA:
    """
    Constructs a DFA from an NFA using the Subset Construction algorithm.
    Resolves token priority for accepting state subsets.
    """
    dfa = DFA()
    alphabet = extract_active_alphabet(nfa)
    dfa.alphabet = alphabet

    # Initial start state: ε-closure({start_state})
    start_closure = epsilon_closure(nfa, {nfa.start_state})

    # Mapping from frozenset of NFA states to DFAState id
    nfa_to_dfa_id: Dict[FrozenSet[int], int] = {}
    unmarked_states: List[FrozenSet[int]] = []

    def create_dfa_state(nfa_subset: FrozenSet[int], is_start: bool = False) -> DFAState:
        s_id = len(nfa_to_dfa_id)
        nfa_to_dfa_id[nfa_subset] = s_id

        # Check accepting conditions
        accepting_nfa_states = [s for s in nfa_subset if s in nfa.accept_states]
        is_accept = len(accepting_nfa_states) > 0

        winner_token = None
        winner_id = None
        winner_priority = None
        candidates = []

        if is_accept:
            # Gather all candidate tokens
            for s in accepting_nfa_states:
                meta = nfa.accept_states[s]
                candidates.append({
                    "nfa_state": s,
                    "token_name": meta["token_name"],
                    "token_id": meta["token_id"],
                    "priority": meta["priority"]
                })
            # Sort candidates by:
            # 1. priority (lower number = higher precedence)
            # 2. token_id
            candidates.sort(key=lambda c: (c["priority"], c["token_id"]))
            winner = candidates[0]
            winner_token = winner["token_name"]
            winner_id = winner["token_id"]
            winner_priority = winner["priority"]

        new_state = DFAState(
            id=s_id,
            nfa_states=nfa_subset,
            is_start=is_start,
            is_accept=is_accept,
            token_name=winner_token,
            token_id=winner_id,
            priority=winner_priority,
            candidate_tokens=candidates
        )
        dfa.add_state(new_state)
        unmarked_states.append(nfa_subset)
        return new_state

    # Initialize DFA start state
    start_dfa_state = create_dfa_state(start_closure, is_start=True)
    dfa.start_state_id = start_dfa_state.id

    while unmarked_states:
        current_subset = unmarked_states.pop(0)
        current_dfa_id = nfa_to_dfa_id[current_subset]
        current_state = dfa.get_state(current_dfa_id)

        # For each symbol in alphabet, calculate next subset
        # Optimization: group symbols that have identical NFA moves
        symbol_targets: Dict[str, FrozenSet[int]] = {}
        for char in alphabet:
            mv = nfa_move(nfa, current_subset, char)
            if mv:
                target_closure = epsilon_closure(nfa, mv)
                if target_closure:
                    symbol_targets[char] = target_closure

        for char, target_closure in symbol_targets.items():
            if target_closure not in nfa_to_dfa_id:
                create_dfa_state(target_closure, is_start=False)

            target_dfa_id = nfa_to_dfa_id[target_closure]
            current_state.transitions[char] = target_dfa_id

    return dfa
