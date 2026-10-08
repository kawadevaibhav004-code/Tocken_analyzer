"""
Vocabulary Manager for Automata-Based Tokenizer.
Maintains stable, deterministic integer IDs.
Reserves:
  PAD = 0
  UNK = 1
  BOS = 2
  EOS = 3
  MASK = 4
Manages:
  - Special tokens
  - Rule-level token IDs
  - Sub-word / lexeme dictionary entries
  - Frequencies
  - JSON & CSV export/import
  - Strict uniqueness validation
"""

import json
import csv
import io
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Set, Tuple

RESERVED_SPECIAL_TOKENS = {
    "PAD": {"id": 0, "type": "SPECIAL", "description": "Padding token for sequence batch alignment"},
    "UNK": {"id": 1, "type": "SPECIAL", "description": "Unknown character / out-of-vocabulary fallback"},
    "BOS": {"id": 2, "type": "SPECIAL", "description": "Beginning of sequence marker"},
    "EOS": {"id": 3, "type": "SPECIAL", "description": "End of sequence marker"},
    "MASK": {"id": 4, "type": "SPECIAL", "description": "Mask token for masked language modeling"}
}

DEFAULT_RULES_VOCAB = [
    {"token": "KEYWORD", "id": 10, "type": "RULE", "regex": "if|else|while|for|return|def|class|import|from", "priority": 1, "frequency": 0, "status": "active"},
    {"token": "DECIMAL", "id": 20, "type": "RULE", "regex": "[0-9]+\\.[0-9]+", "priority": 2, "frequency": 0, "status": "active"},
    {"token": "INTEGER", "id": 21, "type": "RULE", "regex": "[0-9]+", "priority": 3, "frequency": 0, "status": "active"},
    {"token": "NUMBER", "id": 22, "type": "RULE", "regex": "[0-9]+(\\.[0-9]+)?", "priority": 4, "frequency": 0, "status": "active"},
    {"token": "IDENTIFIER", "id": 30, "type": "RULE", "regex": "[a-zA-Z_][a-zA-Z0-9_]*", "priority": 5, "frequency": 0, "status": "active"},
    {"token": "WORD", "id": 31, "type": "RULE", "regex": "[a-zA-Z]+", "priority": 6, "frequency": 0, "status": "active"},
    {"token": "OPERATOR", "id": 40, "type": "RULE", "regex": "[+\\-*/=<>!&|^%]", "priority": 7, "frequency": 0, "status": "active"},
    {"token": "PUNCTUATION", "id": 50, "type": "RULE", "regex": "[,.!?:;\"'()[\\]{}]", "priority": 8, "frequency": 0, "status": "active"},
    {"token": "WHITESPACE", "id": 60, "type": "RULE", "regex": "\\s+", "priority": 9, "frequency": 0, "status": "active"},
    {"token": "SPECIAL", "id": 70, "type": "RULE", "regex": "[@#$^~`\\\\]", "priority": 10, "frequency": 0, "status": "active"},
]


class VocabularyManager:
    def __init__(self):
        self.entries: Dict[str, Dict[str, Any]] = {}
        self.id_to_token: Dict[int, str] = {}
        self.reset_to_default()

    def reset_to_default(self) -> None:
        """Resets vocabulary to reserved tokens and default standard rules."""
        self.entries.clear()
        self.id_to_token.clear()

        # Add reserved special tokens
        for name, info in RESERVED_SPECIAL_TOKENS.items():
            self.entries[name] = {
                "token": name,
                "id": info["id"],
                "type": info["type"],
                "regex": "",
                "priority": 0,
                "frequency": 0,
                "status": "locked",
                "description": info["description"]
            }
            self.id_to_token[info["id"]] = name

        # Add default rule tokens
        for rule in DEFAULT_RULES_VOCAB:
            self.entries[rule["token"]] = {
                "token": rule["token"],
                "id": rule["id"],
                "type": rule["type"],
                "regex": rule["regex"],
                "priority": rule["priority"],
                "frequency": rule["frequency"],
                "status": rule["status"],
                "description": f"Token for regex rule {rule['token']}"
            }
            self.id_to_token[rule["id"]] = rule["token"]

    def add_token(self, token: str, token_id: int, token_type: str = "CUSTOM",
                  regex: str = "", priority: int = 10, description: str = "") -> Dict[str, Any]:
        token = token.strip()
        if not token:
            raise ValueError("Token name cannot be empty.")
        if token_id < 0:
            raise ValueError("Token ID must be a non-negative integer.")
        if token_id in self.id_to_token and self.id_to_token[token_id] != token:
            existing = self.id_to_token[token_id]
            raise ValueError(f"Token ID {token_id} is already assigned to '{existing}'.")
        if token in self.entries and self.entries[token]["id"] != token_id:
            raise ValueError(f"Token '{token}' already exists with ID {self.entries[token]['id']}.")

        entry = {
            "token": token,
            "id": token_id,
            "type": token_type,
            "regex": regex,
            "priority": priority,
            "frequency": 0,
            "status": "active",
            "description": description
        }
        self.entries[token] = entry
        self.id_to_token[token_id] = token
        return entry

    def update_token(self, original_token: str, new_data: Dict[str, Any]) -> Dict[str, Any]:
        if original_token not in self.entries:
            raise ValueError(f"Token '{original_token}' does not exist.")
        
        orig_entry = self.entries[original_token]
        if orig_entry.get("status") == "locked":
            raise ValueError(f"Cannot edit reserved special token '{original_token}'.")

        new_token = new_data.get("token", original_token).strip()
        new_id = int(new_data.get("id", orig_entry["id"]))

        # Check collision with other tokens
        if new_id in self.id_to_token and self.id_to_token[new_id] != original_token:
            existing = self.id_to_token[new_id]
            raise ValueError(f"Token ID {new_id} is already assigned to '{existing}'.")

        if new_token != original_token and new_token in self.entries:
            raise ValueError(f"Token '{new_token}' already exists.")

        # Remove old mappings
        del self.entries[original_token]
        if orig_entry["id"] in self.id_to_token:
            del self.id_to_token[orig_entry["id"]]

        updated = {
            "token": new_token,
            "id": new_id,
            "type": new_data.get("type", orig_entry["type"]),
            "regex": new_data.get("regex", orig_entry["regex"]),
            "priority": int(new_data.get("priority", orig_entry["priority"])),
            "frequency": orig_entry.get("frequency", 0),
            "status": new_data.get("status", orig_entry["status"]),
            "description": new_data.get("description", orig_entry.get("description", ""))
        }
        self.entries[new_token] = updated
        self.id_to_token[new_id] = new_token
        return updated

    def delete_token(self, token: str) -> None:
        if token not in self.entries:
            raise ValueError(f"Token '{token}' does not exist.")
        if self.entries[token].get("status") == "locked":
            raise ValueError(f"Cannot delete reserved special token '{token}'.")
        
        t_id = self.entries[token]["id"]
        del self.entries[token]
        if t_id in self.id_to_token:
            del self.id_to_token[t_id]

    def record_frequencies(self, token_list: List[Dict[str, Any]]) -> None:
        for t in token_list:
            t_name = t.get("token")
            if t_name in self.entries:
                self.entries[t_name]["frequency"] = self.entries[t_name].get("frequency", 0) + 1

    def get_token_id(self, token: str) -> int:
        if token in self.entries:
            return self.entries[token]["id"]
        return RESERVED_SPECIAL_TOKENS["UNK"]["id"]

    def get_token_by_id(self, token_id: int) -> str:
        return self.id_to_token.get(token_id, "UNK")

    def to_dict(self) -> Dict[str, Any]:
        sorted_entries = sorted(self.entries.values(), key=lambda x: x["id"])
        return {
            "total_tokens": len(self.entries),
            "reserved_tokens": len([e for e in sorted_entries if e["type"] == "SPECIAL"]),
            "rule_tokens": len([e for e in sorted_entries if e["type"] == "RULE"]),
            "custom_tokens": len([e for e in sorted_entries if e["type"] == "CUSTOM"]),
            "tokens": sorted_entries
        }

    def export_json(self) -> str:
        data = {
            "metadata": {
                "total_tokens": len(self.entries),
                "format": "Automata-Based Tokenizer Vocabulary v1.0"
            },
            "token_to_id": {k: v["id"] for k, v in self.entries.items()},
            "id_to_token": {str(v["id"]): k for k, v in self.entries.items()},
            "entries": sorted(self.entries.values(), key=lambda x: x["id"])
        }
        return json.dumps(data, indent=2)

    def export_csv(self) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Token", "Token ID", "Type", "Regex", "Priority", "Frequency", "Status", "Description"])
        for e in sorted(self.entries.values(), key=lambda x: x["id"]):
            writer.writerow([
                e["token"], e["id"], e["type"], e.get("regex", ""),
                e.get("priority", 0), e.get("frequency", 0),
                e.get("status", "active"), e.get("description", "")
            ])
        return output.getvalue()

    def import_json(self, json_str: str) -> Dict[str, Any]:
        data = json.loads(json_str)
        imported_count = 0
        entries_to_import = []
        if "entries" in data and isinstance(data["entries"], list):
            entries_to_import = data["entries"]
        elif "token_to_id" in data and isinstance(data["token_to_id"], dict):
            for tok, t_id in data["token_to_id"].items():
                entries_to_import.append({
                    "token": tok,
                    "id": int(t_id),
                    "type": "CUSTOM",
                    "priority": 10
                })

        for item in entries_to_import:
            tok = item.get("token")
            t_id = int(item.get("id"))
            if tok in RESERVED_SPECIAL_TOKENS:
                continue  # preserve reserved
            try:
                self.add_token(
                    token=tok,
                    token_id=t_id,
                    token_type=item.get("type", "CUSTOM"),
                    regex=item.get("regex", ""),
                    priority=int(item.get("priority", 10)),
                    description=item.get("description", "")
                )
                imported_count += 1
            except ValueError:
                # If already exists, update
                self.update_token(tok, item)
                imported_count += 1

        return {"status": "success", "imported": imported_count, "total_now": len(self.entries)}

    def import_csv(self, csv_str: str) -> Dict[str, Any]:
        reader = csv.DictReader(io.StringIO(csv_str))
        imported_count = 0
        for row in reader:
            token = row.get("Token") or row.get("token")
            token_id = row.get("Token ID") or row.get("token_id") or row.get("id")
            if not token or token_id is None:
                continue
            token_id = int(token_id)
            if token in RESERVED_SPECIAL_TOKENS:
                continue
            token_type = row.get("Type", "CUSTOM")
            regex = row.get("Regex", "")
            priority = int(row.get("Priority", 10))
            desc = row.get("Description", "")
            try:
                self.add_token(token, token_id, token_type, regex, priority, desc)
                imported_count += 1
            except ValueError:
                self.update_token(token, {
                    "token": token, "id": token_id, "type": token_type,
                    "regex": regex, "priority": priority, "description": desc
                })
                imported_count += 1

        return {"status": "success", "imported": imported_count, "total_now": len(self.entries)}
