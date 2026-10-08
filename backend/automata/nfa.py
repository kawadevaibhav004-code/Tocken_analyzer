"""
Thompson's Construction Algorithm for Regular Expression to NFA.
Builds non-deterministic finite automata with exact Thompson structure:
  - Base cases: ε-transitions, single character transitions, character set transitions
  - Concatenation, Alternation, Kleene Star, Plus, Optional
  - Multi-rule unification with prioritized token accept states
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple, Any, Union
from .regex_parser import (
    ASTNode, EpsilonNode, CharNode, CharSetNode,
    ConcatNode, AltNode, StarNode, PlusNode, QuestNode, parse_regex, EPSILON
)

@dataclass
class NFATransition:
    from_state: int
    to_state: int
    # symbol can be None (ε), a single char str, or frozenset of chars
    symbol: Optional[Union[str, frozenset]]
    display_label: str
    is_epsilon: bool = False

    def matches(self, char: str) -> bool:
        if self.is_epsilon:
            return False
        if isinstance(self.symbol, str):
            return self.symbol == char
        elif isinstance(self.symbol, frozenset):
            return char in self.symbol
        return False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_state": self.from_state,
            "to_state": self.to_state,
            "display_label": self.display_label,
            "is_epsilon": self.is_epsilon
        }


@dataclass
class NFAFragment:
    start_state: int
    accept_state: int


class NFA:
    def __init__(self):
        self.state_counter: int = 0
        self.transitions: List[NFATransition] = []
        self.start_state: int = 0
        # accept_states: state_id -> dict(token_name, token_id, priority)
        self.accept_states: Dict[int, Dict[str, Any]] = {}
        self.states: Set[int] = set()

    def new_state(self) -> int:
        s = self.state_counter
        self.state_counter += 1
        self.states.add(s)
        return s

    def add_transition(self, from_state: int, to_state: int,
                       symbol: Optional[Union[str, frozenset]],
                       display_label: str, is_epsilon: bool = False) -> None:
        self.states.add(from_state)
        self.states.add(to_state)
        self.transitions.append(NFATransition(
            from_state=from_state,
            to_state=to_state,
            symbol=symbol,
            display_label=display_label,
            is_epsilon=is_epsilon
        ))

    def add_epsilon_transition(self, from_state: int, to_state: int) -> None:
        self.add_transition(from_state, to_state, symbol=None, display_label=EPSILON, is_epsilon=True)

    def get_transitions_from(self, state: int) -> List[NFATransition]:
        return [t for t in self.transitions if t.from_state == state]

    def to_dict(self) -> Dict[str, Any]:
        """Serialize NFA for API / visualization."""
        transitions_list = []
        for t in self.transitions:
            transitions_list.append(t.to_dict())

        accept_list = [
            {
                "state": s,
                "token_name": meta["token_name"],
                "token_id": meta["token_id"],
                "priority": meta["priority"]
            }
            for s, meta in self.accept_states.items()
        ]

        # Transition matrix table view
        table_rows = []
        sorted_states = sorted(list(self.states))
        for s in sorted_states:
            trans = [t for t in self.transitions if t.from_state == s]
            table_rows.append({
                "state": s,
                "is_start": s == self.start_state,
                "is_accept": s in self.accept_states,
                "accept_meta": self.accept_states.get(s),
                "transitions": [
                    {"label": t.display_label, "to": t.to_state, "is_epsilon": t.is_epsilon}
                    for t in trans
                ]
            })

        return {
            "total_states": len(self.states),
            "start_state": self.start_state,
            "accept_states": accept_list,
            "states": sorted_states,
            "transitions": transitions_list,
            "transition_table": table_rows
        }


class ThompsonBuilder:
    """Implements Thompson's Construction on Regex AST."""

    def __init__(self, nfa: Optional[NFA] = None):
        self.nfa = nfa if nfa is not None else NFA()

    def build_from_ast(self, node: ASTNode) -> NFAFragment:
        if isinstance(node, EpsilonNode):
            s = self.nfa.new_state()
            f = self.nfa.new_state()
            self.nfa.add_epsilon_transition(s, f)
            return NFAFragment(s, f)

        elif isinstance(node, CharNode):
            s = self.nfa.new_state()
            f = self.nfa.new_state()
            label = node.char
            if label == " ":
                display = "␣"
            elif label == "\t":
                display = "\\t"
            elif label == "\n":
                display = "\\n"
            else:
                display = label
            self.nfa.add_transition(s, f, symbol=node.char, display_label=display, is_epsilon=False)
            return NFAFragment(s, f)

        elif isinstance(node, CharSetNode):
            s = self.nfa.new_state()
            f = self.nfa.new_state()
            self.nfa.add_transition(s, f, symbol=node.characters, display_label=node.display_name, is_epsilon=False)
            return NFAFragment(s, f)

        elif isinstance(node, ConcatNode):
            left_frag = self.build_from_ast(node.left)
            right_frag = self.build_from_ast(node.right)
            # Connect left accept state to right start state with epsilon
            self.nfa.add_epsilon_transition(left_frag.accept_state, right_frag.start_state)
            return NFAFragment(left_frag.start_state, right_frag.accept_state)

        elif isinstance(node, AltNode):
            left_frag = self.build_from_ast(node.left)
            right_frag = self.build_from_ast(node.right)
            s_new = self.nfa.new_state()
            f_new = self.nfa.new_state()

            self.nfa.add_epsilon_transition(s_new, left_frag.start_state)
            self.nfa.add_epsilon_transition(s_new, right_frag.start_state)
            self.nfa.add_epsilon_transition(left_frag.accept_state, f_new)
            self.nfa.add_epsilon_transition(right_frag.accept_state, f_new)
            return NFAFragment(s_new, f_new)

        elif isinstance(node, StarNode):
            child_frag = self.build_from_ast(node.child)
            s_new = self.nfa.new_state()
            f_new = self.nfa.new_state()

            self.nfa.add_epsilon_transition(s_new, child_frag.start_state)
            self.nfa.add_epsilon_transition(s_new, f_new)
            self.nfa.add_epsilon_transition(child_frag.accept_state, child_frag.start_state)
            self.nfa.add_epsilon_transition(child_frag.accept_state, f_new)
            return NFAFragment(s_new, f_new)

        elif isinstance(node, PlusNode):
            child_frag = self.build_from_ast(node.child)
            s_new = self.nfa.new_state()
            f_new = self.nfa.new_state()

            self.nfa.add_epsilon_transition(s_new, child_frag.start_state)
            self.nfa.add_epsilon_transition(child_frag.accept_state, child_frag.start_state)
            self.nfa.add_epsilon_transition(child_frag.accept_state, f_new)
            return NFAFragment(s_new, f_new)

        elif isinstance(node, QuestNode):
            child_frag = self.build_from_ast(node.child)
            s_new = self.nfa.new_state()
            f_new = self.nfa.new_state()

            self.nfa.add_epsilon_transition(s_new, child_frag.start_state)
            self.nfa.add_epsilon_transition(s_new, f_new)
            self.nfa.add_epsilon_transition(child_frag.accept_state, f_new)
            return NFAFragment(s_new, f_new)

        else:
            raise ValueError(f"Unknown AST Node type: {type(node)}")


def build_single_regex_nfa(pattern: str, token_name: str = "PATTERN", token_id: int = 100, priority: int = 1) -> NFA:
    """Builds an NFA for a single regex pattern."""
    ast = parse_regex(pattern)
    nfa = NFA()
    builder = ThompsonBuilder(nfa)
    fragment = builder.build_from_ast(ast)
    nfa.start_state = fragment.start_state
    nfa.accept_states[fragment.accept_state] = {
        "token_name": token_name,
        "token_id": token_id,
        "priority": priority
    }
    return nfa


def build_lexer_nfa(rules: List[Dict[str, Any]]) -> NFA:
    """
    Builds a unified Lexer NFA combining multiple token rules.
    Each enabled rule is compiled and attached to a shared start state via ε-transitions.
    rules item: { "name": str, "pattern": str, "token_id": int, "priority": int, "enabled": bool }
    """
    nfa = NFA()
    master_start = nfa.new_state()
    nfa.start_state = master_start

    builder = ThompsonBuilder(nfa)

    enabled_rules = [r for r in rules if r.get("enabled", True)]
    # Sort by priority for deterministic state order
    enabled_rules.sort(key=lambda r: (r.get("priority", 100), r.get("token_id", 0)))

    for rule in enabled_rules:
        pattern = rule["pattern"]
        name = rule["name"]
        t_id = rule["token_id"]
        priority = rule.get("priority", 100)

        ast = parse_regex(pattern)
        frag = builder.build_from_ast(ast)
        
        # Connect master start to this rule's fragment start with epsilon
        nfa.add_epsilon_transition(master_start, frag.start_state)
        # Mark accepting state with rule metadata
        nfa.accept_states[frag.accept_state] = {
            "token_name": name,
            "token_id": t_id,
            "priority": priority,
            "description": rule.get("description", "")
        }

    return nfa
