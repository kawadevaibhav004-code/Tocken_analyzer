"""
Deterministic Longest-Match (Maximal Munch) Tokenizer Engine.
Processes raw text streams through finite automata without external AI or regex libraries.
Tracks:
  - Last accepting state
  - Longest match
  - Priority resolution
  - Fallback for unknown characters (UNK)
  - Full character-by-character trace logging
"""

import time
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from .dfa import DFA, DFAState

@dataclass
class Token:
    position: int
    token_name: str
    lexeme: str
    token_id: int
    start: int
    end: int
    dfa_state: int
    priority: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "position": self.position,
            "token": self.token_name,
            "lexeme": self.lexeme,
            "token_id": self.token_id,
            "start": self.start,
            "end": self.end,
            "dfa_state": self.dfa_state,
            "priority": self.priority,
            "length": len(self.lexeme)
        }


@dataclass
class TraceStep:
    char_index: int
    char: str
    from_state: int
    to_state: Optional[int]
    transition_found: bool
    is_accepting: bool
    candidate_token: Optional[str]
    token_id: Optional[int]
    action: str  # "ADVANCE", "MATCH_ACCEPTED", "NO_TRANSITION", "EMIT_TOKEN", "EMIT_UNK"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "char_index": self.char_index,
            "char": self.char if self.char != " " else "␣",
            "from_state": self.from_state,
            "to_state": self.to_state,
            "transition_found": self.transition_found,
            "is_accepting": self.is_accepting,
            "candidate_token": self.candidate_token,
            "token_id": self.token_id,
            "action": self.action
        }


class DeterministicTokenizer:
    def __init__(self, dfa: DFA, unk_token_id: int = 1):
        self.dfa = dfa
        self.unk_token_id = unk_token_id

    def tokenize(self, text: str, include_trace: bool = True) -> Dict[str, Any]:
        start_time = time.perf_counter()

        tokens: List[Token] = []
        trace_steps: List[TraceStep] = []
        cursor = 0
        token_position = 0
        unknown_count = 0
        length = len(text)

        while cursor < length:
            current_state_id = self.dfa.start_state_id
            last_accept_state_id: Optional[int] = None
            last_accept_pos: int = -1
            last_accept_meta: Optional[DFAState] = None

            p = cursor

            while p < length:
                ch = text[p]
                current_state = self.dfa.get_state(current_state_id)
                if not current_state:
                    break

                if ch in current_state.transitions:
                    next_state_id = current_state.transitions[ch]
                    next_state = self.dfa.get_state(next_state_id)

                    is_accept = next_state.is_accept if next_state else False
                    token_cand = next_state.token_name if is_accept else None
                    token_id_cand = next_state.token_id if is_accept else None

                    if include_trace:
                        trace_steps.append(TraceStep(
                            char_index=p,
                            char=ch,
                            from_state=current_state_id,
                            to_state=next_state_id,
                            transition_found=True,
                            is_accepting=is_accept,
                            candidate_token=token_cand,
                            token_id=token_id_cand,
                            action="ADVANCE"
                        ))

                    current_state_id = next_state_id
                    p += 1

                    if is_accept and next_state:
                        last_accept_state_id = next_state_id
                        last_accept_pos = p
                        last_accept_meta = next_state
                else:
                    if include_trace:
                        trace_steps.append(TraceStep(
                            char_index=p,
                            char=ch,
                            from_state=current_state_id,
                            to_state=None,
                            transition_found=False,
                            is_accepting=False,
                            candidate_token=None,
                            token_id=None,
                            action="NO_TRANSITION"
                        ))
                    break

            # Check if an accepting match was found
            if last_accept_pos > cursor and last_accept_meta is not None:
                lexeme = text[cursor:last_accept_pos]
                t = Token(
                    position=token_position,
                    token_name=last_accept_meta.token_name or "TOKEN",
                    lexeme=lexeme,
                    token_id=last_accept_meta.token_id or 100,
                    start=cursor,
                    end=last_accept_pos,
                    dfa_state=last_accept_state_id,
                    priority=last_accept_meta.priority
                )
                tokens.append(t)
                token_position += 1

                if include_trace:
                    trace_steps.append(TraceStep(
                        char_index=last_accept_pos - 1,
                        char=text[last_accept_pos - 1],
                        from_state=last_accept_state_id,
                        to_state=None,
                        transition_found=True,
                        is_accepting=True,
                        candidate_token=t.token_name,
                        token_id=t.token_id,
                        action=f"EMIT_TOKEN: {t.token_name} ('{lexeme}')"
                    ))

                cursor = last_accept_pos
            else:
                # No rule matched: fallback to single character UNK
                unk_char = text[cursor]
                t = Token(
                    position=token_position,
                    token_name="UNKNOWN",
                    lexeme=unk_char,
                    token_id=self.unk_token_id,
                    start=cursor,
                    end=cursor + 1,
                    dfa_state=-1,
                    priority=999
                )
                tokens.append(t)
                token_position += 1
                unknown_count += 1

                if include_trace:
                    trace_steps.append(TraceStep(
                        char_index=cursor,
                        char=unk_char,
                        from_state=current_state_id,
                        to_state=None,
                        transition_found=False,
                        is_accepting=False,
                        candidate_token="UNKNOWN",
                        token_id=self.unk_token_id,
                        action=f"EMIT_UNK: '{unk_char}'"
                    ))

                cursor += 1

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        total_tokens = len(tokens)
        total_chars = len(text)
        avg_len = (total_chars / total_tokens) if total_tokens > 0 else 0.0
        compression_ratio = (total_chars / total_tokens) if total_tokens > 0 else 1.0

        stats = {
            "total_tokens": total_tokens,
            "total_characters": total_chars,
            "unknown_tokens": unknown_count,
            "average_token_length": round(avg_len, 2),
            "processing_time_ms": round(elapsed_ms, 3),
            "compression_ratio": round(compression_ratio, 2),
            "throughput_chars_per_sec": round((total_chars / (elapsed_ms / 1000.0)), 1) if elapsed_ms > 0 else 0.0,
            "throughput_tokens_per_sec": round((total_tokens / (elapsed_ms / 1000.0)), 1) if elapsed_ms > 0 else 0.0,
        }

        return {
            "tokens": [t.to_dict() for t in tokens],
            "stats": stats,
            "trace": [s.to_dict() for s in trace_steps] if include_trace else [],
            "token_ids": [t.token_id for t in tokens],
            "lexemes": [t.lexeme for t in tokens]
        }
