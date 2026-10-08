/**
 * About Page Module.
 * Project background, college demonstration context, and technology specifications.
 */

export function renderAbout(container) {
  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">About Automata-Based Tokenizer</h1>
        <p class="text-slate-400 mt-2 text-sm leading-relaxed">
          A full-stack, production-quality implementation of finite automata theory driving modern machine-learning and large language model preprocessing.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Theory of Computation Core
          </h2>
          <ul class="text-xs text-slate-300 space-y-2">
            <li>• <strong>Recursive Descent Parser:</strong> Formal AST syntax tree generator for regular expressions.</li>
            <li>• <strong>Thompson's Construction:</strong> Inductive NFA state machine synthesis with exact ε-transitions.</li>
            <li>• <strong>Subset Construction:</strong> Complete canonical powerset determinization with multi-rule priority resolution.</li>
            <li>• <strong>Hopcroft Minimization:</strong> Partition refinement calculating dynamic state reduction percentages.</li>
            <li>• <strong>Maximal Munch Engine:</strong> Strict deterministic longest-match token emitter.</li>
          </ul>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Machine Learning Integration
          </h2>
          <ul class="text-xs text-slate-300 space-y-2">
            <li>• <strong>Deterministic Vocabulary:</strong> Stable integer IDs (PAD=0, UNK=1, BOS=2, EOS=3, MASK=4).</li>
            <li>• <strong>Tensor Formatting:</strong> BOS/EOS sequence framing, padding, and truncation.</li>
            <li>• <strong>Attention Masks:</strong> Binary mask generation for Transformer attention alignment.</li>
            <li>• <strong>Multi-Framework Snippets:</strong> Instant code generation for PyTorch and TensorFlow.</li>
            <li>• <strong>Zero Mock Data:</strong> Every graph, state, transition, and metric is generated dynamically from code.</li>
          </ul>
        </div>
      </div>

      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-400">
        <div class="font-bold text-white text-sm">Deployment & Technology Stack</div>
        <p>Backend: Python 3.12, Flask 3.1 REST API, Pure algorithmic automata engine (zero external regex/lexer packages).</p>
        <p>Frontend: Modern Responsive SPA, Tailwind CSS, Interactive Vector SVG Graph Visualizer, Native Web APIs.</p>
      </div>
    </div>
  `;
}
