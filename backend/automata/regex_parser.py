"""
Recursive Descent Regular Expression Parser for Automata-Based Tokenizer.
Parses a regex string into an Abstract Syntax Tree (AST).
Supports:
  - Literals & Escape sequences (\\d, \\w, \\s, \\t, \\n, \\r, etc.)
  - Character classes ([a-z], [0-9], [^0-9], etc.)
  - Wildcard '.'
  - Concatenation
  - Alternation '|'
  - Quantifiers ('*', '+', '?')
  - Grouping with parentheses '(...)'
"""

from dataclasses import dataclass
from typing import Set, List, Optional, Union
import string

EPSILON = "ε"

# ----------------- AST Node Definitions -----------------

class ASTNode:
    pass

@dataclass
class EpsilonNode(ASTNode):
    def __repr__(self):
        return "ε"

@dataclass
class CharNode(ASTNode):
    char: str
    def __repr__(self):
        return f"Char({repr(self.char)})"

@dataclass
class CharSetNode(ASTNode):
    characters: frozenset  # Set of characters matched
    display_name: str      # Human readable, e.g. "[0-9]" or "\\w"
    negated: bool = False

    def __repr__(self):
        return f"CharSet({self.display_name})"

@dataclass
class ConcatNode(ASTNode):
    left: ASTNode
    right: ASTNode
    def __repr__(self):
        return f"Concat({self.left}, {self.right})"

@dataclass
class AltNode(ASTNode):
    left: ASTNode
    right: ASTNode
    def __repr__(self):
        return f"Alt({self.left}, {self.right})"

@dataclass
class StarNode(ASTNode):
    child: ASTNode
    def __repr__(self):
        return f"Star({self.child})"

@dataclass
class PlusNode(ASTNode):
    child: ASTNode
    def __repr__(self):
        return f"Plus({self.child})"

@dataclass
class QuestNode(ASTNode):
    child: ASTNode
    def __repr__(self):
        return f"Quest({self.child})"


# Standard predefined character sets
DIGITS = frozenset(string.digits)
WORD_CHARS = frozenset(string.ascii_letters + string.digits + "_")
WHITESPACE = frozenset(" \t\r\n\v\f")
PRINTABLE = frozenset(c for c in string.printable if c not in "\r\n")

class RegexParseError(Exception):
    def __init__(self, message: str, position: int = -1):
        super().__init__(message)
        self.message = message
        self.position = position


class RegexParser:
    def __init__(self, pattern: str):
        self.pattern = pattern
        self.pos = 0
        self.length = len(pattern)

    def peek(self) -> Optional[str]:
        if self.pos < self.length:
            return self.pattern[self.pos]
        return None

    def get(self) -> Optional[str]:
        if self.pos < self.length:
            ch = self.pattern[self.pos]
            self.pos += 1
            return ch
        return None

    def parse(self) -> ASTNode:
        if not self.pattern:
            return EpsilonNode()
        
        node = self.parse_expression()
        if self.pos < self.length:
            ch = self.peek()
            if ch == ')':
                raise RegexParseError("Unmatched closing parenthesis ')'", self.pos)
            raise RegexParseError(f"Unexpected character '{ch}' at position {self.pos}", self.pos)
        return node

    def parse_expression(self) -> ASTNode:
        """Expression := Term ('|' Term)*"""
        term = self.parse_term()
        while self.peek() == '|':
            self.get()  # consume '|'
            next_term = self.parse_term()
            term = AltNode(term, next_term)
        return term

    def parse_term(self) -> ASTNode:
        """Term := Factor* (implicit concatenation)"""
        factors: List[ASTNode] = []
        while True:
            ch = self.peek()
            if ch is None or ch in ")|":
                break
            factor = self.parse_factor()
            factors.append(factor)

        if not factors:
            return EpsilonNode()
        
        node = factors[0]
        for f in factors[1:]:
            node = ConcatNode(node, f)
        return node

    def parse_factor(self) -> ASTNode:
        """Factor := Base ('*' | '+' | '?')*"""
        base = self.parse_base()
        while True:
            ch = self.peek()
            if ch == '*':
                self.get()
                base = StarNode(base)
            elif ch == '+':
                self.get()
                base = PlusNode(base)
            elif ch == '?':
                self.get()
                base = QuestNode(base)
            else:
                break
        return base

    def parse_base(self) -> ASTNode:
        """Base := Char | Escape | CharClass | '(' Expression ')'"""
        ch = self.peek()
        if ch is None:
            raise RegexParseError("Unexpected end of expression", self.pos)

        if ch == '(':
            self.get()  # consume '('
            node = self.parse_expression()
            if self.peek() != ')':
                raise RegexParseError("Unclosed parenthesis '('", self.pos)
            self.get()  # consume ')'
            return node

        if ch == '[':
            return self.parse_char_class()

        if ch in "*+?":
            raise RegexParseError(f"Target of repeat operator '{ch}' is not specified", self.pos)

        if ch == '\\':
            self.get()  # consume '\'
            esc = self.get()
            if esc is None:
                raise RegexParseError("Trailing backslash '\\' in pattern", self.pos - 1)
            return self.resolve_escape(esc)

        if ch == '.':
            self.get()
            return CharSetNode(PRINTABLE, ".", False)

        # Normal literal character
        self.get()
        return CharNode(ch)

    def resolve_escape(self, esc: str) -> ASTNode:
        if esc == 'd':
            return CharSetNode(DIGITS, "\\d", False)
        elif esc == 'D':
            # Non-digits from printable set
            non_digits = frozenset(c for c in string.printable if c not in DIGITS)
            return CharSetNode(non_digits, "\\D", True)
        elif esc == 'w':
            return CharSetNode(WORD_CHARS, "\\w", False)
        elif esc == 'W':
            non_word = frozenset(c for c in string.printable if c not in WORD_CHARS)
            return CharSetNode(non_word, "\\W", True)
        elif esc == 's':
            return CharSetNode(WHITESPACE, "\\s", False)
        elif esc == 'S':
            non_ws = frozenset(c for c in string.printable if c not in WHITESPACE)
            return CharSetNode(non_ws, "\\S", True)
        elif esc == 't':
            return CharNode('\t')
        elif esc == 'n':
            return CharNode('\n')
        elif esc == 'r':
            return CharNode('\r')
        elif esc in "\\.+*?()[]{}|^$":
            return CharNode(esc)
        else:
            # Escaped standard character, e.g. \- or \a
            return CharNode(esc)

    def parse_char_class(self) -> ASTNode:
        """Parses [a-z0-9_] or [^a-z]"""
        start_pos = self.pos
        self.get()  # consume '['

        negated = False
        if self.peek() == '^':
            negated = True
            self.get()

        chars: Set[str] = set()
        display_parts: List[str] = []

        # If ']' is the first character inside the class, treat as literal ']'
        if self.peek() == ']':
            chars.add(']')
            display_parts.append(']')
            self.get()

        while True:
            ch = self.peek()
            if ch is None:
                raise RegexParseError("Unclosed character class '['", start_pos)
            if ch == ']':
                self.get()  # consume ']'
                break

            if ch == '\\':
                self.get()  # consume '\'
                esc = self.get()
                if esc is None:
                    raise RegexParseError("Trailing backslash in character class", self.pos)
                if esc == 'd':
                    chars.update(DIGITS)
                    display_parts.append("\\d")
                elif esc == 'w':
                    chars.update(WORD_CHARS)
                    display_parts.append("\\w")
                elif esc == 's':
                    chars.update(WHITESPACE)
                    display_parts.append("\\s")
                elif esc == 't':
                    chars.add('\t')
                    display_parts.append("\\t")
                elif esc == 'n':
                    chars.add('\n')
                    display_parts.append("\\n")
                elif esc == 'r':
                    chars.add('\r')
                    display_parts.append("\\r")
                else:
                    chars.add(esc)
                    display_parts.append(esc)
                continue

            # Check for range: ch - next_ch
            cur_char = self.get()
            if self.peek() == '-' and self.pos + 1 < self.length and self.pattern[self.pos + 1] != ']':
                self.get()  # consume '-'
                end_ch = self.get()
                if end_ch == '\\':
                    end_esc = self.get()
                    if end_esc is None:
                        raise RegexParseError("Trailing backslash in range", self.pos)
                    end_ch = end_esc

                start_ord = ord(cur_char)
                end_ord = ord(end_ch)
                if start_ord > end_ord:
                    raise RegexParseError(f"Invalid range in character class: '{cur_char}-{end_ch}'", self.pos)
                for code in range(start_ord, end_ord + 1):
                    chars.add(chr(code))
                display_parts.append(f"{cur_char}-{end_ch}")
            else:
                chars.add(cur_char)
                display_parts.append(cur_char)

        if negated:
            # Invert against printable set
            all_chars = frozenset(c for c in string.printable if c not in chars)
            display_str = "[^" + "".join(display_parts) + "]"
            return CharSetNode(all_chars, display_str, negated=True)
        else:
            display_str = "[" + "".join(display_parts) + "]"
            return CharSetNode(frozenset(chars), display_str, negated=False)


def parse_regex(pattern: str) -> ASTNode:
    """Helper function to parse regex with parser instance."""
    parser = RegexParser(pattern)
    return parser.parse()
