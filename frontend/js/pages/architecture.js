/**
 * Architecture Page Module.
 * Visual interactive pipeline showing the 10 sequential stages from Raw Text to ML Tensors.
 */

import { store } from '../store.js';

const STAGES = [
  {
    id: "stage-1",
    name: "Raw Text Input",
    subtitle: "Arbitrary character stream",
    icon: "📄",
    input: "Raw Multiline UTF-8 text",
    output: "Sequential character buffer",
    description: "Input stream consisting of letters, numbers, symbols, spaces, and unknown/unicode characters.",
    badge: "Input Stream"
  },
  {
    id: "stage-2",
    name: "Regex Token Rules",
    subtitle: "Formal lexical grammar",
    icon: "📜",
    input: "User & system token rules",
    output: "Priority-ordered patterns with IDs",
    description: "Defines patterns for KEYWORD, IDENTIFIER, DECIMAL, INTEGER, OPERATOR, PUNCTUATION, WHITESPACE.",
    badge: "Formal Language"
  },
  {
    id: "stage-3",
    name: "Regex Parser (AST)",
    subtitle: "Recursive descent parser",
    icon: "🌲",
    input: "Regex string pattern",
    output: "Abstract Syntax Tree (AST)",
    description: "Parses concatenation, alternation (|), Kleene star (*), plus (+), optional (?), character classes ([a-z], \\d).",
    badge: "Syntax Analysis"
  },
  {
    id: "stage-4",
    name: "Thompson's Construction NFA",
    subtitle: "Non-deterministic finite automaton",
    icon: "🔀",
    input: "Regex AST nodes",
    output: "NFA with ε-transitions & accept states",
    description: "Inductive construction creating exactly one start state and one accept state per subexpression with ε-closure branching.",
    badge: "Theory of Computation"
  },
  {
    id: "stage-5",
    name: "Subset Construction",
    subtitle: "Powerset construction algorithm",
    icon: "⚙️",
    input: "Thompson NFA",
    output: "Deterministic DFA & state subsets",
    description: "Computes ε-closure(s) and move(T, a) operations to remove non-determinism, mapping each DFA state to an NFA state subset.",
    badge: "Determinization"
  },
  {
    id: "stage-6",
    name: "Hopcroft DFA Minimization",
    subtitle: "Partition refinement",
    icon: "✂️",
    input: "Canonical DFA",
    output: "Minimal equivalent DFA",
    description: "Merges indistinguishable states and eliminates unreachable dead states while preserving token class boundaries.",
    badge: "Optimization"
  },
  {
    id: "stage-7",
    name: "Deterministic Tokenizer",
    subtitle: "Maximal Munch / Longest Match",
    icon: "⚡",
    input: "Input text + Minimized DFA",
    output: "Token stream with start/end positions",
    description: "Advances character by character in O(N) time, recording the last accepting state and resolving priority conflicts.",
    badge: "Lexical Engine"
  },
  {
    id: "stage-8",
    name: "Vocabulary & Integer IDs",
    subtitle: "Deterministic ID mapping",
    icon: "🏷️",
    input: "Emitted tokens & lexemes",
    output: "Stable integer token IDs",
    description: "Maps lexemes and token categories to fixed IDs, reserving IDs 0..4 for PAD, UNK, BOS, EOS, and MASK.",
    badge: "Vocabulary"
  },
  {
    id: "stage-9",
    name: "ML / LLM Preprocessing",
    subtitle: "Tensor sequence generation",
    icon: "🤖",
    input: "Integer ID array",
    output: "BOS/EOS, Padding, Attention Mask",
    description: "Transforms the integer sequence into fixed-length aligned batches ready for embedding matrix lookup in PyTorch/TensorFlow.",
    badge: "AI Preprocessing"
  }
];

export function renderArchitecture(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            End-to-End System Architecture
          </h1>
          <p class="text-xs text-slate-400 mt-1">From Chomsky Type-3 Formal Grammars to Deep Learning Embedding Vectors.</p>
        </div>
      </div>

      <!-- Interactive Sequential Pipeline Flowchart -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Sequential Pipeline Flow</h2>
        <div class="space-y-2">
          ${STAGES.map((stage, idx) => `
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-center">
                <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shadow-sm">
                  ${stage.icon}
                </div>
                ${idx < STAGES.length - 1 ? '<div class="w-0.5 h-6 bg-slate-700 my-1"></div>' : ''}
              </div>

              <div class="flex-1 glass-panel p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer" onclick="inspectArchStage(${idx})">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold font-mono text-cyan-400">Step ${idx + 1}</span>
                    <strong class="text-sm text-white">${stage.name}</strong>
                    <span class="text-xs text-slate-400 font-normal">(${stage.subtitle})</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 w-fit">${stage.badge}</span>
                </div>
                <p class="text-xs text-slate-400">${stage.description}</p>
                <div class="mt-2 flex flex-wrap gap-4 text-[11px] font-mono text-slate-500">
                  <div><span class="text-slate-400 font-sans">In:</span> ${stage.input}</div>
                  <div><span class="text-slate-400 font-sans">Out:</span> <span class="text-emerald-400">${stage.output}</span></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

window.inspectArchStage = (idx) => {
  const stage = STAGES[idx];
  store.showToast(`Inspecting Stage ${idx + 1}: ${stage.name}`, 'info');
};
