"""
DFA Step-by-Step Simulator Engine.
Simulates DFA execution for any input string character by character.
Produces structured simulation frames for UI playback (Play, Pause, Step Forward/Back, Animation).
"""

from typing import List, Dict, Any, Optional
from .dfa import DFA

class DFASimulator:
    def __init__(self, dfa: DFA):
        self.dfa = dfa

    def simulate(self, input_text: str) -> Dict[str, Any]:
        frames = []
        current_state_id = self.dfa.start_state_id
        current_state = self.dfa.get_state(current_state_id)

        # Initial frame at step 0 (before reading any char)
        frames.append({
            "step": 0,
            "char_index": -1,
            "char": "",
            "from_state": current_state_id,
            "to_state": current_state_id,
            "has_transition": True,
            "is_accepting": current_state.is_accept if current_state else False,
            "token_name": current_state.token_name if current_state and current_state.is_accept else None,
            "token_id": current_state.token_id if current_state and current_state.is_accept else None,
            "description": f"Start at State q{current_state_id}"
        })

        halted = False
        for idx, ch in enumerate(input_text):
            if halted:
                frames.append({
                    "step": idx + 1,
                    "char_index": idx,
                    "char": ch if ch != " " else "␣",
                    "from_state": -1,
                    "to_state": -1,
                    "has_transition": False,
                    "is_accepting": False,
                    "token_name": None,
                    "token_id": None,
                    "description": f"Machine halted previously. Cannot consume '{ch}'"
                })
                continue

            current_state = self.dfa.get_state(current_state_id)
            if not current_state:
                halted = True
                continue

            display_ch = ch if ch != " " else "␣"
            if ch in current_state.transitions:
                next_state_id = current_state.transitions[ch]
                next_state = self.dfa.get_state(next_state_id)
                is_acc = next_state.is_accept if next_state else False
                token_n = next_state.token_name if is_acc else None
                token_i = next_state.token_id if is_acc else None

                desc = f"'{display_ch}' : q{current_state_id} → q{next_state_id}"
                if is_acc:
                    desc += f" (Accepting: {token_n})"

                frames.append({
                    "step": idx + 1,
                    "char_index": idx,
                    "char": display_ch,
                    "from_state": current_state_id,
                    "to_state": next_state_id,
                    "has_transition": True,
                    "is_accepting": is_acc,
                    "token_name": token_n,
                    "token_id": token_i,
                    "description": desc
                })
                current_state_id = next_state_id
            else:
                halted = True
                frames.append({
                    "step": idx + 1,
                    "char_index": idx,
                    "char": display_ch,
                    "from_state": current_state_id,
                    "to_state": -1,
                    "has_transition": False,
                    "is_accepting": False,
                    "token_name": None,
                    "token_id": None,
                    "description": f"No transition from q{current_state_id} on '{display_ch}' (Machine Trapped/Halted)"
                })

        final_state = self.dfa.get_state(current_state_id) if not halted else None
        accepted = (final_state is not None and final_state.is_accept and not halted)

        return {
            "input_text": input_text,
            "total_steps": len(frames),
            "final_accepted": accepted,
            "final_state": current_state_id if not halted else -1,
            "final_token": final_state.token_name if accepted else None,
            "frames": frames
        }
