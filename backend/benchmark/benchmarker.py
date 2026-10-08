"""
Performance Benchmark Suite for Automata-Based Tokenizer.
Generates realistic textual payloads of sizes (1 KB, 10 KB, 100 KB, 1 MB, etc.)
and executes real deterministic tokenization, computing exact:
  - Elapsed time (ms)
  - Tokens generated
  - Characters/sec throughput
  - Tokens/sec throughput
  - MB/s bandwidth
"""

import time
import sys
from typing import List, Dict, Any, Optional
try:
    from automata import DeterministicTokenizer, DFA
except ImportError:
    from ..automata import DeterministicTokenizer, DFA

SAMPLE_TEXT_SEED = (
    "The quick brown fox jumps over the lazy dog 12345 times. "
    "Machine learning models require deterministic tokenization pipelines. "
    "Let total_loss = 0.042 * epoch + bias; if (accuracy > 0.98) return true; "
    "Finite state automata (NFA and DFA) provide O(N) linear time processing! "
)

class BenchmarkSuite:
    def __init__(self, dfa: DFA):
        self.tokenizer = DeterministicTokenizer(dfa)

    def generate_text_of_size(self, target_bytes: int) -> str:
        """Generates realistic code/English text of approximately target_bytes size."""
        seed_len = len(SAMPLE_TEXT_SEED)
        repeat_count = (target_bytes // seed_len) + 1
        full_str = SAMPLE_TEXT_SEED * repeat_count
        return full_str[:target_bytes]

    def run_benchmark(self, requested_sizes: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Runs benchmarks across multiple sizes.
        Default sizes: 1 KB (1,024 B), 10 KB (10,240 B), 100 KB (102,400 B), 500 KB (512,000 B), 1 MB (1,048,576 B).
        """
        if not requested_sizes:
            requested_sizes = [
                1024,          # 1 KB
                10 * 1024,     # 10 KB
                100 * 1024,    # 100 KB
                500 * 1024,    # 500 KB
                1024 * 1024    # 1 MB
            ]

        results = []
        for size_bytes in requested_sizes:
            label = self.format_size_label(size_bytes)
            text_payload = self.generate_text_of_size(size_bytes)
            actual_chars = len(text_payload)

            # Warmup
            _ = self.tokenizer.tokenize(text_payload[:100], include_trace=False)

            # Timed run
            t_start = time.perf_counter()
            tok_res = self.tokenizer.tokenize(text_payload, include_trace=False)
            t_end = time.perf_counter()

            elapsed_sec = t_end - t_start
            elapsed_ms = elapsed_sec * 1000.0
            total_tokens = tok_res["stats"]["total_tokens"]

            chars_per_sec = (actual_chars / elapsed_sec) if elapsed_sec > 0 else 0.0
            tokens_per_sec = (total_tokens / elapsed_sec) if elapsed_sec > 0 else 0.0
            mb_per_sec = (actual_chars / (1024 * 1024)) / elapsed_sec if elapsed_sec > 0 else 0.0

            results.append({
                "size_bytes": size_bytes,
                "label": label,
                "total_characters": actual_chars,
                "total_tokens": total_tokens,
                "elapsed_ms": round(elapsed_ms, 2),
                "chars_per_sec": round(chars_per_sec, 0),
                "tokens_per_sec": round(tokens_per_sec, 0),
                "mb_per_sec": round(mb_per_sec, 2),
                "avg_token_length": round(tok_res["stats"]["average_token_length"], 2)
            })

        return {
            "timestamp": time.time(),
            "benchmarks": results,
            "summary": {
                "max_throughput_tokens_sec": max(r["tokens_per_sec"] for r in results),
                "max_bandwidth_mb_sec": max(r["mb_per_sec"] for r in results),
                "tested_sizes": [r["label"] for r in results]
            }
        }

    @staticmethod
    def format_size_label(size_bytes: int) -> str:
        if size_bytes >= 1024 * 1024:
            return f"{size_bytes // (1024 * 1024)} MB"
        elif size_bytes >= 1024:
            return f"{size_bytes // 1024} KB"
        return f"{size_bytes} B"
