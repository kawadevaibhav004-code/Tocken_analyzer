"""
Flask REST API Server for Automata-Based Tokenizer for LLMs.
Connects the automata engine, vocabulary system, ML pipeline, test lab, and benchmark.
"""

import os
import json
import time
import uuid
from typing import Dict, Any, List
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS

from automata import (
    build_lexer_nfa, build_single_regex_nfa,
    subset_construction, minimize_dfa,
    DeterministicTokenizer, DFASimulator,
    parse_regex, RegexParseError
)
from vocabulary import VocabularyManager
from ml_export import MLPipeline, ExportService
from test_lab import TestLabRunner
from benchmark import BenchmarkSuite

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
RULES_FILE = os.path.join(DATA_DIR, "rules.json")
DEFAULT_RULES_FILE = os.path.join(DATA_DIR, "default_rules.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

# Global State
vocab_mgr = VocabularyManager()
ml_pipeline = MLPipeline()

# In-memory automata cache
active_rules: List[Dict[str, Any]] = []
cached_nfa = None
cached_dfa = None
cached_min_dfa = None
cached_stats = {}


def load_settings() -> Dict[str, Any]:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "longest_match": True,
        "priority_resolution": True,
        "unknown_token_id": 1,
        "unknown_handling": "fallback_single_char",
        "add_bos": True,
        "add_eos": True,
        "pad_token_id": 0,
        "max_sequence_length": 64,
        "padding_strategy": "max_length",
        "truncation": True,
        "theme": "dark"
    }


def save_settings(settings: Dict[str, Any]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)


def load_rules() -> List[Dict[str, Any]]:
    target = RULES_FILE if os.path.exists(RULES_FILE) else DEFAULT_RULES_FILE
    if os.path.exists(target):
        try:
            with open(target, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_rules(rules: List[Dict[str, Any]]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(RULES_FILE, "w", encoding="utf-8") as f:
        json.dump(rules, f, indent=2)


def rebuild_automata():
    global active_rules, cached_nfa, cached_dfa, cached_min_dfa, cached_stats
    enabled_rules = [r for r in active_rules if r.get("enabled", True)]
    
    t0 = time.perf_counter()
    nfa = build_lexer_nfa(enabled_rules)
    t_nfa = (time.perf_counter() - t0) * 1000.0

    t1 = time.perf_counter()
    dfa = subset_construction(nfa)
    t_dfa = (time.perf_counter() - t1) * 1000.0

    t2 = time.perf_counter()
    min_dfa, min_stats = minimize_dfa(dfa)
    t_min = (time.perf_counter() - t2) * 1000.0

    cached_nfa = nfa
    cached_dfa = dfa
    cached_min_dfa = min_dfa
    cached_stats = {
        "nfa_build_time_ms": round(t_nfa, 2),
        "dfa_build_time_ms": round(t_dfa, 2),
        "minimization_time_ms": round(t_min, 2),
        "total_pipeline_time_ms": round(t_nfa + t_dfa + t_min, 2),
        "nfa_states": len(nfa.states),
        "nfa_transitions": len(nfa.transitions),
        "dfa_states": len(dfa.states),
        "minimized_dfa_states": len(min_dfa.states),
        "state_reduction_pct": min_stats.get("reduction_percentage", 0.0),
        "states_removed": min_stats.get("states_removed", 0)
    }


# Initial load
active_rules = load_rules()
rebuild_automata()

# ----------------- API Endpoints -----------------

@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "online",
        "system_name": "Automata-Based Tokenizer for LLMs",
        "version": "1.0.0",
        "rules_count": len(active_rules),
        "enabled_rules_count": len([r for r in active_rules if r.get("enabled", True)]),
        "vocabulary_size": len(vocab_mgr.entries),
        "pipeline_stats": cached_stats
    })


@app.route("/api/rules", methods=["GET"])
def get_rules():
    return jsonify({
        "rules": active_rules
    })


@app.route("/api/rules", methods=["POST"])
def add_rule():
    data = request.json or {}
    name = data.get("name", "").strip()
    pattern = data.get("pattern", "").strip()
    token_id = data.get("token_id")
    priority = data.get("priority", 10)
    description = data.get("description", "")
    enabled = data.get("enabled", True)

    if not name:
        return jsonify({"error": "Rule name is required."}), 400
    if not pattern:
        return jsonify({"error": "Regular expression pattern is required."}), 400
    if token_id is None:
        return jsonify({"error": "Token ID is required."}), 400

    try:
        token_id = int(token_id)
        priority = int(priority)
    except ValueError:
        return jsonify({"error": "Token ID and priority must be integers."}), 400

    # Validate regex syntax
    try:
        parse_regex(pattern)
    except RegexParseError as e:
        return jsonify({"error": f"Invalid regex pattern: {e.message} (at pos {e.position})"}), 400

    # Check duplicate ID
    for r in active_rules:
        if r["token_id"] == token_id:
            return jsonify({"error": f"Token ID {token_id} is already used by rule '{r['name']}'."}), 400
        if r["name"].upper() == name.upper():
            return jsonify({"error": f"Rule name '{name}' already exists."}), 400

    new_rule = {
        "id": f"rule_{uuid.uuid4().hex[:8]}",
        "name": name.upper(),
        "pattern": pattern,
        "token_id": token_id,
        "priority": priority,
        "description": description,
        "enabled": enabled
    }

    active_rules.append(new_rule)
    save_rules(active_rules)

    # Register in vocabulary manager
    try:
        vocab_mgr.add_token(name.upper(), token_id, "RULE", pattern, priority, description)
    except Exception:
        pass

    rebuild_automata()
    return jsonify({"message": "Rule added successfully", "rule": new_rule, "pipeline_stats": cached_stats})


@app.route("/api/rules/<rule_id>", methods=["PUT"])
def update_rule(rule_id: str):
    data = request.json or {}
    idx = next((i for i, r in enumerate(active_rules) if r["id"] == rule_id), None)
    if idx is None:
        return jsonify({"error": "Rule not found."}), 404

    current_rule = active_rules[idx]
    name = data.get("name", current_rule["name"]).strip().upper()
    pattern = data.get("pattern", current_rule["pattern"]).strip()
    token_id = int(data.get("token_id", current_rule["token_id"]))
    priority = int(data.get("priority", current_rule["priority"]))
    description = data.get("description", current_rule.get("description", ""))
    enabled = bool(data.get("enabled", current_rule.get("enabled", True)))

    # Validate regex
    try:
        parse_regex(pattern)
    except RegexParseError as e:
        return jsonify({"error": f"Invalid regex pattern: {e.message}"}), 400

    # Check ID collisions
    for i, r in enumerate(active_rules):
        if i != idx and r["token_id"] == token_id:
            return jsonify({"error": f"Token ID {token_id} is already in use by rule '{r['name']}'."}), 400

    active_rules[idx] = {
        "id": rule_id,
        "name": name,
        "pattern": pattern,
        "token_id": token_id,
        "priority": priority,
        "description": description,
        "enabled": enabled
    }
    save_rules(active_rules)

    # Update in vocabulary manager
    try:
        vocab_mgr.update_token(current_rule["name"], {
            "token": name,
            "id": token_id,
            "type": "RULE",
            "regex": pattern,
            "priority": priority,
            "description": description
        })
    except Exception:
        pass

    rebuild_automata()
    return jsonify({"message": "Rule updated successfully", "rule": active_rules[idx], "pipeline_stats": cached_stats})


@app.route("/api/rules/<rule_id>", methods=["DELETE"])
def delete_rule(rule_id: str):
    global active_rules
    idx = next((i for i, r in enumerate(active_rules) if r["id"] == rule_id), None)
    if idx is None:
        return jsonify({"error": "Rule not found."}), 404

    deleted = active_rules.pop(idx)
    save_rules(active_rules)

    try:
        vocab_mgr.delete_token(deleted["name"])
    except Exception:
        pass

    rebuild_automata()
    return jsonify({"message": "Rule deleted", "deleted_rule": deleted, "pipeline_stats": cached_stats})


@app.route("/api/rules/reset", methods=["POST"])
def reset_rules():
    global active_rules
    if os.path.exists(DEFAULT_RULES_FILE):
        with open(DEFAULT_RULES_FILE, "r", encoding="utf-8") as f:
            active_rules = json.load(f)
    save_rules(active_rules)
    vocab_mgr.reset_to_default()
    rebuild_automata()
    return jsonify({"message": "Reset to default rules successfully", "rules": active_rules, "pipeline_stats": cached_stats})


@app.route("/api/automata/build", methods=["POST"])
def build_automata_endpoint():
    rebuild_automata()
    return jsonify({
        "stats": cached_stats,
        "nfa": cached_nfa.to_dict(),
        "dfa": cached_dfa.to_dict(),
        "minimized_dfa": cached_min_dfa.to_dict()
    })


@app.route("/api/automata/single-nfa", methods=["POST"])
def single_regex_nfa():
    """Builds an isolated NFA for inspecting a specific regex in the NFA viewer."""
    data = request.json or {}
    pattern = data.get("pattern", "").strip()
    if not pattern:
        return jsonify({"error": "Pattern cannot be empty"}), 400
    try:
        nfa = build_single_regex_nfa(pattern, token_name="CUSTOM", token_id=999, priority=1)
        dfa = subset_construction(nfa)
        min_dfa, m_stats = minimize_dfa(dfa)
        return jsonify({
            "pattern": pattern,
            "nfa": nfa.to_dict(),
            "dfa": dfa.to_dict(),
            "minimized_dfa": min_dfa.to_dict(),
            "reduction_stats": m_stats
        })
    except RegexParseError as e:
        return jsonify({"error": f"Regex Parse Error: {e.message}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tokenize", methods=["POST"])
def tokenize_endpoint():
    data = request.json or {}
    text = data.get("text", "")
    use_minimized = data.get("use_minimized", True)
    include_trace = data.get("include_trace", True)

    target_dfa = cached_min_dfa if use_minimized else cached_dfa
    if not target_dfa:
        rebuild_automata()
        target_dfa = cached_min_dfa if use_minimized else cached_dfa

    settings = load_settings()
    unk_id = settings.get("unknown_token_id", 1)

    tokenizer = DeterministicTokenizer(target_dfa, unk_token_id=unk_id)
    result = tokenizer.tokenize(text, include_trace=include_trace)

    # Update frequencies in vocabulary manager
    vocab_mgr.record_frequencies(result["tokens"])

    return jsonify(result)


@app.route("/api/simulate", methods=["POST"])
def simulate_endpoint():
    data = request.json or {}
    input_text = data.get("input_text", "")
    use_minimized = data.get("use_minimized", True)

    target_dfa = cached_min_dfa if use_minimized else cached_dfa
    if not target_dfa:
        rebuild_automata()
        target_dfa = cached_min_dfa if use_minimized else cached_dfa

    simulator = DFASimulator(target_dfa)
    result = simulator.simulate(input_text)
    return jsonify(result)


@app.route("/api/vocabulary", methods=["GET"])
def get_vocabulary():
    return jsonify(vocab_mgr.to_dict())


@app.route("/api/vocabulary/token", methods=["POST"])
def add_vocab_token():
    data = request.json or {}
    try:
        entry = vocab_mgr.add_token(
            token=data.get("token", ""),
            token_id=int(data.get("id")),
            token_type=data.get("type", "CUSTOM"),
            regex=data.get("regex", ""),
            priority=int(data.get("priority", 10)),
            description=data.get("description", "")
        )
        return jsonify({"message": "Token added", "token": entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/vocabulary/token/<token_name>", methods=["PUT"])
def update_vocab_token(token_name: str):
    data = request.json or {}
    try:
        entry = vocab_mgr.update_token(token_name, data)
        return jsonify({"message": "Token updated", "token": entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/vocabulary/token/<token_name>", methods=["DELETE"])
def delete_vocab_token(token_name: str):
    try:
        vocab_mgr.delete_token(token_name)
        return jsonify({"message": f"Token '{token_name}' deleted."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/vocabulary/reset", methods=["POST"])
def reset_vocabulary():
    vocab_mgr.reset_to_default()
    return jsonify({"message": "Vocabulary reset to defaults", "vocabulary": vocab_mgr.to_dict()})


@app.route("/api/vocabulary/export/<fmt>", methods=["GET"])
def export_vocabulary(fmt: str):
    if fmt == "csv":
        csv_data = vocab_mgr.export_csv()
        return Response(csv_data, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=vocabulary.csv"})
    else:
        json_data = vocab_mgr.export_json()
        return Response(json_data, mimetype="application/json", headers={"Content-disposition": "attachment; filename=vocabulary.json"})


@app.route("/api/vocabulary/import", methods=["POST"])
def import_vocabulary():
    data = request.json or {}
    content = data.get("content", "")
    fmt = data.get("format", "json")
    try:
        if fmt == "csv":
            res = vocab_mgr.import_csv(content)
        else:
            res = vocab_mgr.import_json(content)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": f"Failed to import vocabulary: {str(e)}"}), 400


@app.route("/api/ml/preprocess", methods=["POST"])
def ml_preprocess():
    data = request.json or {}
    token_ids = data.get("token_ids", [])
    settings = load_settings()

    add_bos = data.get("add_bos", settings.get("add_bos", True))
    add_eos = data.get("add_eos", settings.get("add_eos", True))
    max_length = data.get("max_length", settings.get("max_sequence_length", 64))
    pad_to_max = data.get("pad_to_max", settings.get("padding_strategy", "max_length") == "max_length")
    truncation = data.get("truncation", settings.get("truncation", True))

    result = ml_pipeline.process_sequence(
        token_ids=token_ids,
        add_bos=add_bos,
        add_eos=add_eos,
        max_length=max_length,
        pad_to_max=pad_to_max,
        truncation=truncation
    )
    return jsonify(result)


@app.route("/api/test-lab/run", methods=["GET", "POST"])
def run_tests():
    data = (request.json if request.is_json else None) or {}
    use_custom = data.get("use_current_rules", False)
    runner = TestLabRunner(active_rules if use_custom else None)
    result = runner.run_all()
    return jsonify(result)


@app.route("/api/benchmark/run", methods=["POST"])
def run_benchmark():
    data = request.json or {}
    sizes = data.get("sizes")
    target_dfa = cached_min_dfa or cached_dfa
    suite = BenchmarkSuite(target_dfa)
    result = suite.run_benchmark(requested_sizes=sizes)
    return jsonify(result)


@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify(load_settings())


@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.json or {}
    save_settings(data)
    return jsonify({"message": "Settings updated", "settings": data})


# Serve Frontend static assets
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if FRONTEND_DIR and os.path.exists(FRONTEND_DIR):
        target_path = os.path.join(FRONTEND_DIR, path)
        if path != "" and os.path.exists(target_path) and os.path.isfile(target_path):
            return send_from_directory(FRONTEND_DIR, path)
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({"message": "Backend API is online. Frontend index.html not found in frontend directory."})


if __name__ == "__main__":
    print(f"Starting Automata-Based Tokenizer API server on http://localhost:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)
