import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from automata import build_lexer_nfa, subset_construction, minimize_dfa, DeterministicTokenizer, DFASimulator

rules = [
    {"name": "DECIMAL", "pattern": r"[0-9]+\.[0-9]+", "token_id": 101, "priority": 1, "enabled": True},
    {"name": "NUMBER", "pattern": r"[0-9]+", "token_id": 102, "priority": 2, "enabled": True},
    {"name": "WORD", "pattern": r"[a-zA-Z]+", "token_id": 103, "priority": 3, "enabled": True},
    {"name": "WHITESPACE", "pattern": r"\s+", "token_id": 104, "priority": 4, "enabled": True},
    {"name": "PUNCTUATION", "pattern": r"[,.!?:;]", "token_id": 105, "priority": 5, "enabled": True},
]

print("Building NFA...")
nfa = build_lexer_nfa(rules)
print(f"NFA states: {len(nfa.states)}, transitions: {len(nfa.transitions)}")

print("Running Subset Construction...")
dfa = subset_construction(nfa)
print(f"DFA states: {len(dfa.states)}")

print("Running DFA Minimization...")
min_dfa, stats = minimize_dfa(dfa)
print(f"Minimized DFA states: {len(min_dfa.states)}, reduction: {stats['reduction_percentage']}%")

print("Tokenizing test text...")
text = "Hello, world! This is Automata 123.45 and 999."
tok = DeterministicTokenizer(min_dfa)
res = tok.tokenize(text)
print(f"Total tokens produced: {len(res['tokens'])}")
for t in res["tokens"]:
    print(f"  Pos {t['position']}: [{t['token']}] '{t['lexeme']}' (ID: {t['token_id']}) @ DFA q{t['dfa_state']}")

print("\nTesting DFA Simulator on '123.45':")
sim = DFASimulator(min_dfa)
s_res = sim.simulate("123.45")
print(f"Simulation accepted? {s_res['final_accepted']}, final token: {s_res['final_token']}")
for f in s_res["frames"]:
    print(f"  Step {f['step']}: char='{f['char']}' {f['description']}")
