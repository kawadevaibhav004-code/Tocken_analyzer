"""
Machine Learning Preprocessing & Tensor Pipeline.
Converts tokenizer outputs to ML/LLM ready integer tensors with:
  - BOS (2) and EOS (3) markers
  - Configurable sequence length, padding (0), and truncation
  - Binary Attention Mask generation
  - PyTorch & TensorFlow snippet generation
  - Multi-format exports (JSON, CSV, Plain Sequence, DFA JSON)
"""

import json
import csv
import io
from typing import List, Dict, Any, Optional

class MLPipeline:
    def __init__(self, pad_id: int = 0, unk_id: int = 1, bos_id: int = 2, eos_id: int = 3):
        self.pad_id = pad_id
        self.unk_id = unk_id
        self.bos_id = bos_id
        self.eos_id = eos_id

    def process_sequence(
        self,
        token_ids: List[int],
        add_bos: bool = True,
        add_eos: bool = True,
        max_length: Optional[int] = 32,
        pad_to_max: bool = True,
        truncation: bool = True
    ) -> Dict[str, Any]:
        """
        Takes raw integer token IDs and formats into ML-ready tensor representation.
        """
        seq = list(token_ids)

        if add_bos:
            seq = [self.bos_id] + seq
        if add_eos:
            seq = seq + [self.eos_id]

        orig_len = len(seq)
        is_truncated = False

        if max_length and max_length > 0:
            if truncation and len(seq) > max_length:
                seq = seq[:max_length]
                # If EOS was requested, ensure the final position is EOS
                if add_eos and len(seq) > 1:
                    seq[-1] = self.eos_id
                is_truncated = True

            attention_mask = [1] * len(seq)

            if pad_to_max and len(seq) < max_length:
                pad_needed = max_length - len(seq)
                seq = seq + [self.pad_id] * pad_needed
                attention_mask = attention_mask + [0] * pad_needed
        else:
            attention_mask = [1] * len(seq)

        pytorch_code = f"import torch\ninput_ids = torch.tensor([{seq}])\nattention_mask = torch.tensor([{attention_mask}])"
        tensorflow_code = f"import tensorflow as tf\ninput_ids = tf.constant([{seq}])\nattention_mask = tf.constant([{attention_mask}])"

        return {
            "input_ids": seq,
            "attention_mask": attention_mask,
            "original_length": orig_len,
            "final_length": len(seq),
            "is_truncated": is_truncated,
            "padded_tokens": seq.count(self.pad_id) if pad_to_max else 0,
            "pytorch_snippet": pytorch_code,
            "tensorflow_snippet": tensorflow_code
        }


class ExportService:
    @staticmethod
    def to_json(data: Dict[str, Any]) -> str:
        return json.dumps(data, indent=2)

    @staticmethod
    def to_csv_tokens(tokens: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Position", "Token", "Lexeme", "Token ID", "Start", "End", "DFA State", "Priority"])
        for t in tokens:
            writer.writerow([
                t.get("position", 0),
                t.get("token", ""),
                t.get("lexeme", ""),
                t.get("token_id", 0),
                t.get("start", 0),
                t.get("end", 0),
                t.get("dfa_state", -1),
                t.get("priority", 0)
            ])
        return output.getvalue()

    @staticmethod
    def to_plain_sequence(token_ids: List[int]) -> str:
        return str(token_ids)
