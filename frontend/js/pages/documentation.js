/**
 * In-App Documentation Page Module.
 * Comprehensive mathematical and practical theory connecting Theory of Computation
 * to modern Language Model tokenization.
 */

export function renderDocumentation(container) {
  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Formal Theory & LLM Tokenization Guide</h1>
        <p class="text-slate-400 mt-2 text-sm leading-relaxed">
          Comprehensive documentation explaining how formal automata theory (Regular Languages, Thompson NFA, Subset Construction, Hopcroft Minimization) serves as the exact deterministic foundation of machine-learning preprocessing.
        </p>
      </div>

      <!-- TOC -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider mb-3">Table of Contents</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <a href="#doc-what-is-tok" class="text-blue-400 hover:underline">1. What is a Tokenizer?</a>
          <a href="#doc-why-llms" class="text-blue-400 hover:underline">2. Why Tokenization is Required for LLMs</a>
          <a href="#doc-regex" class="text-blue-400 hover:underline">3. Regular Expressions (Type-3)</a>
          <a href="#doc-nfa" class="text-blue-400 hover:underline">4. Non-Deterministic Finite Automata</a>
          <a href="#doc-thompson" class="text-blue-400 hover:underline">5. Thompson's Construction Algorithm</a>
          <a href="#doc-subset" class="text-blue-400 hover:underline">6. Subset Construction & ε-Closure</a>
          <a href="#doc-dfa" class="text-blue-400 hover:underline">7. Deterministic Finite Automata (DFA)</a>
          <a href="#doc-minimization" class="text-blue-400 hover:underline">8. Hopcroft DFA Minimization</a>
          <a href="#doc-longest-match" class="text-blue-400 hover:underline">9. Longest-Match (Maximal Munch)</a>
          <a href="#doc-priority" class="text-blue-400 hover:underline">10. Priority Conflict Resolution</a>
          <a href="#doc-vocab" class="text-blue-400 hover:underline">11. Vocabulary & Stable Integer IDs</a>
          <a href="#doc-ml" class="text-blue-400 hover:underline">12. ML Preprocessing & Attention Masks</a>
        </div>
      </div>

      <!-- Section 1 & 2 -->
      <div id="doc-what-is-tok" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-blue-400 font-mono text-base">01.</span> What is a Tokenizer?
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          A tokenizer (also called a lexical analyzer or lexer) is the first processing phase in computational language processing. It accepts an unstructured stream of raw characters and partitions it into structured semantic units known as <strong>tokens</strong>.
        </p>
        <p class="text-slate-300 text-sm leading-relaxed">
          Each token consists of a <strong>token type</strong> (such as <code class="text-cyan-300">NUMBER</code> or <code class="text-cyan-300">KEYWORD</code>), a concrete text slice called a <strong>lexeme</strong> (e.g. <code class="text-amber-300">"42"</code>), and an associated integer ID used for matrix and vector indexing.
        </p>
      </div>

      <div id="doc-why-llms" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-blue-400 font-mono text-base">02.</span> Why Tokenization is Required for LLMs
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          Large Language Models (like GPT, LLaMA, BERT, and Gemini) cannot process raw UTF-8 strings directly. Neural networks operate exclusively on continuous numerical matrices through an <strong>Embedding Layer</strong>:
        </p>
        <div class="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800 my-2">
          E: {0, 1, ..., |V|-1} → ℝ^d
        </div>
        <p class="text-slate-300 text-sm leading-relaxed">
          The tokenizer converts the raw input string into a 1D tensor of integer IDs: <code class="text-cyan-300">[2, 103, 105, 104, 3]</code>. These integers serve as indices into the model's embedding matrix. Tokenization reduces sequence length, compresses textual redundancies, and bounds vocabulary complexity.
        </p>
      </div>

      <!-- Section 3 & 4 -->
      <div id="doc-thompson" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-purple-400 font-mono text-base">03.</span> Thompson's Construction Algorithm
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          Ken Thompson introduced this inductive algorithm in 1968. It transforms any regular expression into an equivalent NFA with ε-transitions in linear time \(O(N)\).
        </p>
        <div class="space-y-2 text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>• Base case (symbol 'a'):  s_start ── a ──&gt; s_accept</div>
          <div>• Concatenation (AB):     fragA.accept ── ε ──&gt; fragB.start</div>
          <div>• Alternation (A|B):      new_s ── ε ──&gt; A.start &amp; B.start; A.accept &amp; B.accept ── ε ──&gt; new_f</div>
          <div>• Kleene Star (A*):      new_s ── ε ──&gt; A.start &amp; new_f; A.accept ── ε ──&gt; A.start &amp; new_f</div>
        </div>
      </div>

      <!-- Section 5 & 6 -->
      <div id="doc-subset" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-blue-400 font-mono text-base">04.</span> Subset Construction &amp; ε-Closure
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          NFAs can have multiple transitions on the same symbol and spontaneous ε-transitions. To execute in deterministic \(O(N)\) time without backtracking, the powerset construction algorithm converts the NFA into an equivalent DFA:
        </p>
        <div class="space-y-1.5 text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>1. ε-closure(T): Set of all NFA states reachable from set T along ε-transitions only.</div>
          <div>2. move(T, a): Set of states reachable by consuming character 'a' from any state in T.</div>
          <div>3. DFA Start State: D_0 = ε-closure({ s_start })</div>
          <div>4. DFA Transition: δ_DFA(T, a) = ε-closure(move(T, a))</div>
        </div>
      </div>

      <!-- Section 7 & 8 -->
      <div id="doc-minimization" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-emerald-400 font-mono text-base">05.</span> DFA Minimization (Partition Refinement)
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          The subset construction often produces redundant or equivalent DFA states. DFA Minimization (via Hopcroft's algorithm) merges states that exhibit identical future transition behavior:
        </p>
        <p class="text-slate-300 text-sm leading-relaxed">
          In a lexer DFA, accepting states that emit <em>different</em> tokens must never be merged. Thus, the initial partition \(P_0\) splits non-accepting states from accepting states, grouped strictly by their token type. Partitions are iteratively split until no two states in any block can be distinguished.
        </p>
      </div>

      <!-- Section 9 & 10 -->
      <div id="doc-longest-match" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-amber-400 font-mono text-base">06.</span> Maximal Munch (Longest-Match) &amp; Priority
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          Deterministic lexical scanning requires two universal tie-breaking rules:
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-slate-300">
          <li><strong>Longest-Match (Maximal Munch):</strong> The DFA continues reading characters as long as transitions exist. When a transition fails, it falls back to the <em>last accepting state</em> encountered. For example, <code class="text-cyan-300">"123.45"</code> is matched as a single <code class="text-emerald-300">DECIMAL</code> rather than integer <code class="text-amber-300">"123"</code> + dot.</li>
          <li><strong>Rule Priority:</strong> If an accepting state matches multiple rules (e.g. <code class="text-cyan-300">"if"</code> matching both <code class="text-emerald-300">KEYWORD</code> and <code class="text-blue-300">IDENTIFIER</code>), the rule with the highest priority (lowest numerical priority value) is deterministically selected.</li>
        </ul>
      </div>

      <!-- Section 11 & 12 -->
      <div id="doc-ml" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="text-cyan-400 font-mono text-base">07.</span> Reserved Special IDs &amp; ML Preprocessing
        </h2>
        <p class="text-slate-300 text-sm leading-relaxed">
          Every production tokenizer preserves reserved IDs for transformer architecture requirements:
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-center my-2">
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800"><span class="text-slate-400 block">PAD</span><strong class="text-amber-400">0</strong></div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800"><span class="text-slate-400 block">UNK</span><strong class="text-amber-400">1</strong></div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800"><span class="text-slate-400 block">BOS</span><strong class="text-amber-400">2</strong></div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800"><span class="text-slate-400 block">EOS</span><strong class="text-amber-400">3</strong></div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800"><span class="text-slate-400 block">MASK</span><strong class="text-amber-400">4</strong></div>
        </div>
        <p class="text-slate-300 text-sm leading-relaxed">
          The binary <strong>Attention Mask</strong> tensor marks non-padding elements with <code class="text-emerald-300">1</code> and padding elements with <code class="text-slate-500">0</code> so scaled dot-product attention \(\text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + M\right)\) masks out irrelevant padding keys.
        </p>
      </div>
    </div>
  `;
}
