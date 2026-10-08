/**
 * Simple Tokenizer Page for College Demo.
 * Requirements:
 *  - Simple text input
 *  - Tokenize button
 *  - Display: Token (Lexeme) | Type | ID
 *  - Maximal Munch longest match
 *  - UNKNOWN fallback for unmatched characters
 */

import { store } from '../store.js';
import { API } from '../api.js';

export function renderTokenizer(container) {
  const result = store.state.lastTokenization;

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚡</span>
            Deterministic Tokenizer
          </h1>
          <p class="text-xs text-slate-400 mt-1">Converts text stream to tokens via Maximal Munch (Longest Match) in O(N) time.</p>
        </div>

        <!-- Quick sample buttons -->
        <div class="flex items-center gap-2">
          <button id="btn-load-sample" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition">
            Load Sample
          </button>
          <button id="btn-clear-tok" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white border border-slate-700 transition">
            Clear
          </button>
        </div>
      </div>

      <!-- Text Input & Button -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Input String</label>
          <textarea id="tok-page-input" rows="4" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-blue-500 transition resize-none" placeholder="Enter text to tokenize...">if count == 100 return 42</textarea>
        </div>

        <div class="flex items-center justify-between">
          <button id="btn-tok-run" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2">
            <span>⚡</span>
            <span>Tokenize</span>
          </button>
          <button id="btn-tok-copy-ids" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition">
            Copy Token IDs
          </button>
        </div>
      </div>

      <!-- Simple Token Output Table -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-white">Token Output Table</h2>
          <span id="tok-count-badge" class="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            ${result?.tokens?.length || 0} tokens
          </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Token (Lexeme)</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4 text-right">Token ID</th>
              </tr>
            </thead>
            <tbody id="tok-table-tbody" class="divide-y divide-slate-800/80 bg-slate-950/60">
              ${renderTable(result?.tokens)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  bindTokenizerEvents(container);
}

function bindTokenizerEvents(container) {
  const inputEl = document.getElementById('tok-page-input');
  const btnRun = document.getElementById('btn-tok-run');
  const btnSample = document.getElementById('btn-load-sample');
  const btnClear = document.getElementById('btn-clear-tok');
  const btnCopyIds = document.getElementById('btn-tok-copy-ids');

  btnSample.onclick = () => {
    inputEl.value = "if total <= 50 return total + 10";
  };

  btnClear.onclick = () => {
    inputEl.value = "";
  };

  btnRun.onclick = async () => {
    const text = inputEl.value;
    if (!text) return;
    btnRun.disabled = true;
    btnRun.textContent = "Tokenizing...";

    try {
      const res = await API.tokenize(text, true, false);
      store.setTokenizationResult(res);
      document.getElementById('tok-table-tbody').innerHTML = renderTable(res.tokens);
      document.getElementById('tok-count-badge').textContent = `${res.tokens.length} tokens`;
      store.showToast(`Extracted ${res.tokens.length} tokens!`, 'success');
    } catch (err) {
      store.showToast(err.message, 'error');
    } finally {
      btnRun.disabled = false;
      btnRun.innerHTML = `<span>⚡</span><span>Tokenize</span>`;
    }
  };

  btnCopyIds.onclick = () => {
    const res = store.state.lastTokenization;
    if (res && res.token_ids) {
      navigator.clipboard.writeText(JSON.stringify(res.token_ids));
      store.showToast('Copied token IDs array!', 'info');
    }
  };
}

function renderTable(tokens) {
  if (!tokens || tokens.length === 0) {
    return `
      <tr>
        <td colspan="3" class="text-center py-6 text-slate-500 italic">
          Enter text and click 'Tokenize' above.
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
