/**
 * Simple, Clean Dashboard Page for College Project Demonstration.
 * Shows:
 *  - Project Title & Short Description
 *  - 4 Key Metrics: Regex Rules, NFA States, DFA States, Minimized DFA States
 *  - Simple Text Input & "Tokenize" button
 *  - Simple Table: Token (Lexeme) | Token Type | Token ID
 */

import { store } from '../store.js';
import { API } from '../api.js';

export function renderDashboard(container) {
  const stats = store.state.pipelineStats || {};
  const rules = store.state.rules || [];
  const lastTok = store.state.lastTokenization;

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Project Title & Description -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Automata-Based Tokenizer</h1>
        <p class="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
          A deterministic tokenizer that translates regular expressions through finite automata (Thompson NFA → Subset DFA → Minimized DFA) into structured integer token IDs for machine learning preprocessing.
        </p>
      </div>

      <!-- 4 Key Metrics Only -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Regex Rules</span>
          <div class="text-3xl font-bold text-white font-mono">${rules.length || 5}</div>
          <span class="text-[11px] text-slate-500 font-sans">Active patterns</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span class="text-xs font-semibold text-blue-400 uppercase tracking-wider block">NFA States</span>
          <div class="text-3xl font-bold text-blue-400 font-mono">${stats.nfa_states ?? 25}</div>
          <span class="text-[11px] text-slate-500 font-sans">Thompson model</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span class="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">DFA States</span>
          <div class="text-3xl font-bold text-cyan-400 font-mono">${stats.dfa_states ?? 14}</div>
          <span class="text-[11px] text-slate-500 font-sans">Subset construction</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Minimized DFA</span>
          <div class="text-3xl font-bold text-emerald-400 font-mono">${stats.minimized_dfa_states ?? 11}</div>
          <span class="text-[11px] text-emerald-500 font-semibold font-sans">${stats.state_reduction_pct ?? 0}% reduction</span>
        </div>
      </div>

      <!-- Simple Text Input & Tokenize Button -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Input Text</label>
          <textarea id="dash-input-text" rows="3" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-blue-500 transition resize-none" placeholder="Enter text to tokenize...">if count == 100 return count</textarea>
        </div>

        <div class="flex items-center justify-between">
          <button id="btn-dash-tokenize" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2">
            <span>⚡</span>
            <span>Tokenize</span>
          </button>
          <span class="text-xs text-slate-500 font-mono">Maximal Munch O(N)</span>
        </div>
      </div>

      <!-- Simple Token Output Table -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-white">Generated Tokens</h2>
          <span id="dash-token-count" class="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            ${lastTok?.tokens?.length || 0} tokens
          </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Token (Lexeme)</th>
                <th class="py-3 px-4">Token Type</th>
                <th class="py-3 px-4 text-right">Token ID</th>
              </tr>
            </thead>
            <tbody id="dash-token-tbody" class="divide-y divide-slate-800/80 bg-slate-950/60">
              ${renderSimpleTable(lastTok?.tokens)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const btnTokenize = document.getElementById('btn-dash-tokenize');
  const inputEl = document.getElementById('dash-input-text');

  btnTokenize.onclick = async () => {
    const text = inputEl.value;
    if (!text) return;
    btnTokenize.disabled = true;
    btnTokenize.textContent = 'Tokenizing...';

    try {
      const res = await API.tokenize(text, true, false);
      store.setTokenizationResult(res);
      document.getElementById('dash-token-tbody').innerHTML = renderSimpleTable(res.tokens);
      document.getElementById('dash-token-count').textContent = `${res.tokens.length} tokens`;
      store.showToast(`Tokenized ${res.tokens.length} tokens!`, 'success');
    } catch (err) {
      store.showToast(err.message, 'error');
    } finally {
      btnTokenize.disabled = false;
      btnTokenize.innerHTML = `<span>⚡</span><span>Tokenize</span>`;
    }
  };
}

function renderSimpleTable(tokens) {
  if (!tokens || tokens.length === 0) {
    return `
      <tr>
        <td colspan="3" class="text-center py-6 text-slate-500 italic">
          Click 'Tokenize' above to see tokens.
        </td>
      </tr>
    `;
  }

  return tokens.map(t => {
    const display = t.lexeme === ' ' ? '␣ (Space)' : t.lexeme === '\n' ? '\\n (Newline)' : t.lexeme === '\t' ? '\\t' : t.lexeme;
    return `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="py-2.5 px-4 font-bold text-white font-mono bg-slate-900/30">${escapeHtml(display)}</td>
        <td class="py-2.5 px-4 font-semibold ${t.token === 'UNKNOWN' ? 'text-rose-400' : 'text-blue-300'} font-sans">${t.token}</td>
        <td class="py-2.5 px-4 text-right font-bold text-amber-300 font-mono">${t.token_id}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
