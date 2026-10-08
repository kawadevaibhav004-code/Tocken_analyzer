"""
Automated Test Lab Suite for Automata-Based Tokenizer.
Tests 15+ real scenarios including words, numbers, decimals, longest-match,
priority conflicts, unicode, unknown characters, and edge cases.
"""

import time
from typing import List, Dict, Any
try:
    from automata import (
        build_lexer_nfa, subset_construction, minimize_dfa,
        DeterministicTokenizer
    )
except ImportError:
    from ..automata import (
        build_lexer_nfa, subset_construction, minimize_dfa,
        DeterministicTokenizer
    )

DEFAULT_TEST_RULES = [
    {"name": "KEYWORD_IF", "pattern": "if", "token_id": 10, "priority": 1, "enabled": True},
    {"name": "DECIMAL", "pattern": r"[0-9]+\.[0-9]+", "token_id": 20, "priority": 2, "enabled": True},
    {"name": "INTEGER", "pattern": r"[0-9]+", "token_id": 21, "priority": 3, "enabled": True},
    {"name": "IDENTIFIER", "pattern": r"[a-zA-Z_][a-zA-Z0-9_]*", "token_id": 30, "priority": 4, "enabled": True},
    {"name": "WORD", "pattern": r"[a-zA-Z]+", "token_id": 31, "priority": 5, "enabled": True},
    {"name": "OPERATOR", "pattern": r"[+\-*/=<>!]", "token_id": 40, "priority": 6, "enabled": True},
    {"name": "PUNCTUATION", "pattern": r"[,.!?:;]", "token_id": 50, "priority": 7, "enabled": True},
    {"name": "WHITESPACE", "pattern": r"\s+", "token_id": 60, "priority": 8, "enabled": True},
]

TEST_CASES = [
    {
        "id": "tc_01",
        "name": "Words Recognition",
        "description": "Verify alphabetic words are correctly matched as WORD/IDENTIFIER",
        "input": "alpha beta gamma",
        "expected_tokens": ["alpha", "beta", "gamma"],
        "expected_token_types": ["IDENTIFIER", "IDENTIFIER", "IDENTIFIER"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_02",
        "name": "Integer Numbers",
        "description": "Verify digit sequences match INTEGER tokens",
        "input": "42 1024 9999",
        "expected_tokens": ["42", "1024", "9999"],
        "expected_token_types": ["INTEGER", "INTEGER", "INTEGER"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_03",
        "name": "Decimal Values",
        "description": "Verify floating point numbers match DECIMAL tokens",
        "input": "3.1415 0.5 99.99",
        "expected_tokens": ["3.1415", "0.5", "99.99"],
        "expected_token_types": ["DECIMAL", "DECIMAL", "DECIMAL"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_04",
        "name": "Punctuation Marks",
        "description": "Verify standard punctuation characters match PUNCTUATION",
        "input": ", . ? ; :",
        "expected_tokens": [",", ".", "?", ";", ":"],
        "expected_token_types": ["PUNCTUATION", "PUNCTUATION", "PUNCTUATION", "PUNCTUATION", "PUNCTUATION"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_05",
        "name": "Whitespace Detection",
        "description": "Verify consecutive spaces, tabs, and newlines match WHITESPACE",
        "input": "word1 \t\n word2",
        "expected_tokens": ["word1", " \t\n ", "word2"],
        "expected_token_types": ["IDENTIFIER", "WHITESPACE", "IDENTIFIER"],
        "ignore_whitespace": False
    },
    {
        "id": "tc_06",
        "name": "Arithmetic & Comparison Operators",
        "description": "Verify mathematical operators match OPERATOR",
        "input": "+ - * / = < > !",
        "expected_tokens": ["+", "-", "*", "/", "=", "<", ">", "!"],
        "expected_token_types": ["OPERATOR", "OPERATOR", "OPERATOR", "OPERATOR", "OPERATOR", "OPERATOR", "OPERATOR", "OPERATOR"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_07",
        "name": "Mixed Code Statement",
        "description": "Verify combined statement tokenization: variable = 10 + 20;",
        "input": "total = 10 + 20;",
        "expected_tokens": ["total", "=", "10", "+", "20", ";"],
        "expected_token_types": ["IDENTIFIER", "OPERATOR", "INTEGER", "OPERATOR", "INTEGER", "PUNCTUATION"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_08",
        "name": "Empty Input Handling",
        "description": "Verify tokenizer produces zero tokens on empty string without crashing",
        "input": "",
        "expected_tokens": [],
        "expected_token_types": [],
        "ignore_whitespace": False
    },
    {
        "id": "tc_09",
        "name": "Unknown & Unmatched Characters",
        "description": "Verify unknown characters trigger UNKNOWN fallback tokens (ID 1)",
        "input": "abc @#$ 123",
        "expected_tokens": ["abc", "@", "#", "$", "123"],
        "expected_token_types": ["IDENTIFIER", "UNKNOWN", "UNKNOWN", "UNKNOWN", "INTEGER"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_10",
        "name": "Unicode Characters",
        "description": "Verify non-ASCII unicode characters fall back safely to UNKNOWN without halting",
        "input": "hi 🚀 π world",
        "expected_tokens": ["hi", "🚀", "π", "world"],
        "expected_token_types": ["IDENTIFIER", "UNKNOWN", "UNKNOWN", "IDENTIFIER"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_11",
        "name": "Longest-Match (Maximal Munch) Rule",
        "description": "Verify '123.45' is consumed as single DECIMAL rather than INTEGER '123' + PUNCTUATION '.' + INTEGER '45'",
        "input": "123.45",
        "expected_tokens": ["123.45"],
        "expected_token_types": ["DECIMAL"],
        "ignore_whitespace": False
    },
    {
        "id": "tc_12",
        "name": "Priority Conflict: Keyword vs Identifier",
        "description": "Verify 'if' is recognized as KEYWORD_IF (priority 1) rather than generic IDENTIFIER (priority 4)",
        "input": "if ifvar",
        "expected_tokens": ["if", "ifvar"],
        "expected_token_types": ["KEYWORD_IF", "IDENTIFIER"],
        "ignore_whitespace": True
    },
    {
        "id": "tc_13",
        "name": "Long String Robustness",
        "description": "Verify repeated token pattern of 500 characters tokenizes correctly",
        "input": ("item " * 100).strip(),
        "expected_tokens_count": 199,  # 100 items + 99 spaces
        "expected_token_types": None,
        "ignore_whitespace": False
    },
    {
        "id": "tc_14",
        "name": "Underscore Identifiers",
        "description": "Verify variable names with leading and embedded underscores",
        "input": "_temp_val_01",
        "expected_tokens": ["_temp_val_01"],
        "expected_token_types": ["IDENTIFIER"],
        "ignore_whitespace": False
    },
    {
        "id": "tc_15",
        "name": "Decimal Without Leading Space",
        "description": "Verify decimal adjacent to operators: 100.25+50.75",
        "input": "100.25+50.75",
        "expected_tokens": ["100.25", "+", "50.75"],
        "expected_token_types": ["DECIMAL", "OPERATOR", "DECIMAL"],
        "ignore_whitespace": False
    }
]


class TestLabRunner:
    def __init__(self, rules: List[Dict[str, Any]] = None):
        self.rules = rules or DEFAULT_TEST_RULES

    def run_all(self) -> Dict[str, Any]:
        overall_start = time.perf_counter()

        # Build real automaton
        nfa = build_lexer_nfa(self.rules)
        dfa = subset_construction(nfa)
        min_dfa, _ = minimize_dfa(dfa)
        tokenizer = DeterministicTokenizer(min_dfa)

        results = []
        passed_count = 0

        for tc in TEST_CASES:
            t0 = time.perf_counter()
            tok_res = tokenizer.tokenize(tc["input"], include_trace=False)
            t_elapsed_ms = (time.perf_counter() - t0) * 1000.0

            raw_tokens = tok_res["tokens"]
            if tc["ignore_whitespace"]:
                filtered_tokens = [t for t in raw_tokens if t["token"] != "WHITESPACE"]
            else:
                filtered_tokens = raw_tokens

            actual_lexemes = [t["lexeme"] for t in filtered_tokens]
            actual_types = [t["token"] for t in filtered_tokens]

            # Evaluation
            passed = True
            diff_notes = []

            if "expected_tokens_count" in tc:
                if len(filtered_tokens) != tc["expected_tokens_count"]:
                    passed = False
                    diff_notes.append(f"Expected count {tc['expected_tokens_count']}, got {len(filtered_tokens)}")
            else:
                expected_lex = tc["expected_tokens"]
                expected_types = tc["expected_token_types"]

                if actual_lexemes != expected_lex:
                    passed = False
                    diff_notes.append(f"Lexeme mismatch. Expected: {expected_lex}, Actual: {actual_lexemes}")

                if expected_types and actual_types != expected_types:
                    passed = False
                    diff_notes.append(f"Type mismatch. Expected: {expected_types}, Actual: {actual_types}")

            if passed:
                passed_count += 1

            results.append({
                "id": tc["id"],
                "name": tc["name"],
                "description": tc["description"],
                "input": tc["input"][:50] + ("..." if len(tc["input"]) > 50 else ""),
                "status": "PASS" if passed else "FAIL",
                "execution_time_ms": round(t_elapsed_ms, 3),
                "expected": {
                    "lexemes": tc.get("expected_tokens", f"{tc.get('expected_tokens_count')} tokens"),
                    "types": tc.get("expected_token_types", [])
                },
                "actual": {
                    "lexemes": actual_lexemes[:10] + (["..."] if len(actual_lexemes) > 10 else []),
                    "types": actual_types[:10] + (["..."] if len(actual_types) > 10 else [])
                },
                "difference": "; ".join(diff_notes) if diff_notes else "None (Exact match)"
            })

        total_elapsed_ms = (time.perf_counter() - overall_start) * 1000.0

        return {
            "total_tests": len(TEST_CASES),
            "passed": passed_count,
            "failed": len(TEST_CASES) - passed_count,
            "pass_rate_pct": round((passed_count / len(TEST_CASES)) * 100, 1),
            "total_execution_time_ms": round(total_elapsed_ms, 2),
            "test_results": results
        }
