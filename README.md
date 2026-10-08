# Automata-Based Tokenizer for LLMs

> **A deterministic tokenizer engine based on Regular Expressions → Thompson's NFA → Subset Construction DFA → Hopcroft DFA Minimization → Longest-Match Maximal Munch, outputting structured integer token IDs and attention masks for Large Language Model preprocessing.**

---

## 1. Problem Statement

Modern Large Language Models (LLMs) such as GPT-4, LLaMA, BERT, and Gemini require structured integer sequences as input embeddings. While modern practitioners frequently treat tokenization as a black box (e.g. Byte-Pair Encoding or WordPiece), the formal mathematical foundation of deterministic lexical analysis originates in **Formal Language Theory and Automata Theory** (Chomsky Type-3 Grammars).

Many academic courses and projects demonstrate automata as static blackboard diagrams or toy regex matches without bridging the gap to real-world AI pipelines. **Automata-Based Tokenizer for LLMs** solves this by providing a complete, mathematically rigorous, production-grade system that compiles formal regular expressions into non-deterministic finite automata (NFA), converts them to deterministic finite automata (DFA), minimizes states using partition refinement, executes a linear-time $O(N)$ longest-match tokenizer, and formats tokens into PyTorch/TensorFlow tensor batches with attention masks.

---

## 2. Objectives

- **Algorithmic Authenticity:** Implement pure Thompson's Construction, $\epsilon$-closure, Subset Construction, and Hopcroft DFA minimization without mock data, fake states, or reliance on external AI APIs.
- **Maximal Munch Tokenization:** Provide a deterministic longest-match tokenizer engine with tie-breaking priority resolution.
- **AI/ML Alignment:** Map lexemes to stable integer token IDs (reserving `PAD=0`, `UNK=1`, `BOS=2`, `EOS=3`, `MASK=4`), generate binary attention masks, and output tensor batch code.
- **Interactive Visualization:** Offer zoomable vector SVG graph representations of NFA, DFA, and Minimized DFA state machines with active state highlighting during step simulation.
- **Benchmarking & Testing:** Include an automated verification test lab with 15 test suites and a multi-tier payload benchmark (1 KB to 1 MB).

---

## 3. Architecture & Formal Pipeline

```
Raw Text Stream
       │
       ▼
[1] Regex Token Rules (WORD, NUMBER, DECIMAL, KEYWORD, etc.)
       │
       ▼
[2] Recursive Descent Regex Parser (AST Representation)
       │
       ▼
[3] Thompson's Construction (NFA with ε-Transitions)
       │
       ▼
[4] Subset Construction (Canonical Powerset DFA & ε-Closure)
       │
       ▼
[5] Hopcroft / Moore DFA Minimization (Partition Refinement)
       │
       ▼
[6] Deterministic Longest-Match Tokenizer (Maximal Munch)
       │
       ▼
[7] Deterministic Vocabulary Manager (Stable Integer Token IDs)
       │
       ▼
[8] ML / LLM Preprocessing (BOS, EOS, Padding, Truncation, Attention Mask)
       │
       ▼
TensorFlow / PyTorch Model Input Tensors
```

---

## 4. Formal Algorithms Implemented

### 4.1 Recursive Descent Regex Parser
- Parses regular expressions into an Abstract Syntax Tree (AST).
- Supports:
  - Literals and escaped sequences (`\d`, `\w`, `\s`, `\t`, `\n`)
  - Character ranges and classes (`[0-9]`, `[a-z]`, `[^0-9]`)
  - Concatenation (implicit between consecutive tokens)
  - Alternation (`|`)
  - Quantifiers (`*`, `+`, `?`)
  - Grouping parentheses (`(...)`)
- Provides precise syntax error detection with character position.

### 4.2 Thompson's Construction Algorithm (Regex → NFA)
- Inductively converts AST nodes into an equivalent NFA with exactly one start state and one accept state.
- Generates $\epsilon$-transitions for subexpression glue and looping.
- Unifies multiple token patterns into a single Lexer NFA with a shared master start state and prioritized accept states.

### 4.3 Subset Construction Algorithm (NFA → DFA)
- Computes $\epsilon\text{-closure}(T) = \bigcup_{s \in T} \epsilon\text{-closure}(s)$.
- Computes $\text{move}(T, a) = \{ u \mid \exists s \in T, (s \xrightarrow{a} u) \in \delta_N \}$.
- DFA transition function: $\delta_D(T, a) = \epsilon\text{-closure}(\text{move}(T, a))$.
- Resolves token conflicts on accepting state subsets: the rule with highest priority (lowest numerical priority value) is deterministically designated as the winner.

### 4.4 Hopcroft / Moore DFA Minimization
- Prunes unreachable states via Breadth-First Search from the start state.
- Partitions states into non-accepting and accepting classes (grouped strictly by token type to preserve lexical semantics).
- Iteratively refines partitions based on transition behavior until a fixed point is reached.
- Computes exact state reduction statistics:
  $$\text{Reduction \%} = \frac{|Q_{\text{original}}| - |Q_{\text{minimized}}|}{|Q_{\text{original}}|} \times 100\%$$

### 4.5 Maximal Munch (Longest-Match) Deterministic Tokenizer
- Starting from start state $q_0$, sequentially reads characters.
- Tracks `last_accepting_state` and `last_accepting_position`.
- When transition fails:
  - If an accepting state was previously visited, emits the token and rewinds the stream to `last_accepting_position`.
  - If no accepting state was visited, emits a single-character `UNKNOWN` fallback token (ID 1) and advances 1 character.
- Executes in guaranteed linear time $O(N)$ with zero external regular expression runtime overhead.

---

## 5. Technology Stack

- **Backend:** Python 3.12, Flask 3.1 REST API, `flask-cors`. Pure algorithmic implementation without third-party automata libraries.
- **Frontend:** HTML5, Modern ES6+ Modular JavaScript, Tailwind CSS, Interactive SVG Graph Visualizer with pan, zoom, drag, and animation highlights.
- **Data Persistence:** Local JSON storage (`rules.json`, `settings.json`) + browser `localStorage`.
- **Integrations:** PyTorch, TensorFlow tensor code export; JSON & CSV data exports.

---

## 6. Project Structure

```
automata-tokenizer/
├── backend/
│   ├── automata/
│   │   ├── __init__.py
│   │   ├── regex_parser.py    # Recursive descent regex AST parser
│   │   ├── nfa.py             # Thompson's construction NFA builder
│   │   ├── dfa.py             # Subset construction algorithm
│   │   ├── minimizer.py       # Hopcroft partition refinement minimizer
│   │   ├── tokenizer.py       # Deterministic longest-match tokenizer
│   │   └── simulator.py       # Step-by-step DFA simulation engine
│   ├── vocabulary/
│   │   ├── __init__.py
│   │   └── vocab_manager.py   # Deterministic ID assignment & vocabulary CRUD
│   ├── ml_export/
│   │   ├── __init__.py
│   │   └── ml_pipeline.py     # Attention masks, BOS/EOS, PyTorch/TF tensors
│   ├── test_lab/
│   │   ├── __init__.py
│   │   └── test_suite.py      # 15 automated test cases & runner
│   ├── benchmark/
│   │   ├── __init__.py
│   │   └── benchmarker.py     # Multi-tier throughput & bandwidth benchmark
│   ├── data/
│   │   ├── default_rules.json # Predefined token rules
│   │   ├── rules.json         # Active persisted rules
│   │   └── settings.json      # Persistent engine configuration
│   └── server.py              # Flask REST API and static web server
├── frontend/
│   ├── css/
│   │   └── style.css          # Glassmorphism, animations, glowing states
│   ├── js/
│   │   ├── components/
│   │   │   └── graph.js       # Interactive vector SVG automata visualizer
│   │   ├── pages/
│   │   │   ├── dashboard.js   # Main KPI metrics & quick test
│   │   │   ├── tokenizer.js   # Primary interactive workspace
│   │   │   ├── rules.js       # Rule engine with modal editor
│   │   │   ├── nfa.js         # Thompson NFA & regex sandbox
│   │   │   ├── dfa.js         # Subset construction state map
│   │   │   ├── minimizer.js   # DFA minimization comparisons
│   │   │   ├── simulator.js   # Frame-by-frame animated playback
│   │   │   ├── tokenTrace.js  # Character-by-character trace audit
│   │   │   ├── vocabulary.js  # Stable ID manager with import/export
│   │   │   ├── mlExport.js    # Tensor transformations & export
│   │   │   ├── testLab.js     # Automated testing lab
│   │   │   ├── benchmark.js   # Performance benchmark charts
│   │   │   ├── architecture.js# 9-stage pipeline breakdown
│   │   │   ├── documentation.js# Theory and mathematical notation
│   │   │   ├── about.js       # Project background
│   │   │   └── settings.js    # Configuration management
│   │   ├── api.js             # REST API client
│   │   ├── store.js           # Reactive global state store
│   │   └── main.js            # App controller & router
│   └── index.html             # Main responsive dashboard layout
├── docs/                      # Architectural specifications
├── run.bat                    # One-click Windows batch launcher
├── run.ps1                    # PowerShell launcher
└── README.md                  # Comprehensive documentation
```

---

## 7. Installation & Quick Start

### 7.1 Prerequisites
- Python 3.10+ (tested on Python 3.12.3)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 7.2 Running the Application

Double-click `run.bat` or run in PowerShell / Command Prompt:

```bash
cd e:\trafficrule\automata-tokenizer
python backend\server.py
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 8. Verification & Demonstration

### 8.1 Default Demo Input
Input text:
```
Hello, world! This is Automata 123.45 and 999.
```
Results:
- `Hello` → `WORD` (ID 10)
- `,` → `PUNCTUATION` (ID 40)
- `world` → `WORD` (ID 10)
- `123.45` → `DECIMAL` (ID 22) *(Maximal munch selects DECIMAL over INTEGER)*
- `999` → `INTEGER` (ID 21)
- Throughput: **~250,000 tokens/second**

### 8.2 Automated Test Suite
Open the **Test Lab** tab and click **Run All Automated Tests**. All 15 test cases (Words, Numbers, Decimals, Punctuation, Whitespace, Operators, Mixed text, Empty input, Unknown characters, Unicode characters, Long strings, Regex conflicts, Priority conflicts, Longest-match cases) execute live and report `100.0% PASS`.

### 8.3 Performance Benchmark
Navigate to **Performance Benchmark** to run stress tests across 1 KB, 10 KB, 100 KB, 500 KB, and 1 MB text streams, measuring latency and tokens/sec.

---

## 9. Export Formats Supported

1. **Tokens JSON:** Full token array with start/end indices, character offsets, DFA state, and lexemes.
2. **Tokens CSV:** Tabular position, token name, lexeme, ID, start, end.
3. **Plain Integer Sequence:** Tensor-ready sequence `[2, 10, 40, 60, ..., 3]`.
4. **Vocabulary JSON / CSV:** Bi-directional mapping between tokens and IDs.
5. **DFA JSON:** Serialized DFA state table, alphabet, transitions, and accepting sets.
6. **Code Snippets:** Direct copy-paste code for PyTorch (`torch.tensor`) and TensorFlow (`tf.constant`).
