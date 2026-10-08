/**
 * Simple, Clean ML Output Page for College Project Demonstration.
 * Shows only:
 *  - Input IDs
 *  - Attention Mask
 * Supports BOS (ID 2), EOS (ID 3), and PAD (ID 0).
 */

import { store } from '../store.js';
import { API } from '../api.js';

let currentMLData = null;

export function renderMLExport(container) {
  const lastTok = store.state.lastTokenization;
  const tokenIds = lastTok?.token_ids || [80, 60, 50, 21, 80, 21];

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800">
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <span>🤖</span>
          ML Output (LLM Preprocessing)
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Formats token IDs into embedding tensor sequences with BOS, EOS, and Attention Mask.
        </p>
      </div>

      <!-- Settings Controls: BOS, EOS, PAD -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Special Tokens & Formatting</span>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
            <input type="checkbox" id="ml-chk-bos" checked class="rounded bg-slate-800 border-slate-700 text-blue-500">
            <span>Add BOS (<strong class="text-amber-400 font-mono">ID: 2</strong>)</span>
          </label>

          <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
            <input type="checkbox" id="ml-chk-eos" checked class="rounded bg-slate-800 border-slate-700 text-blue-500">
            <span>Add EOS (<strong class="text-amber-400 font-mono">ID: 3</strong>)</span>
          </label>

          <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
            <input type="checkbox" id="ml-chk-pad" checked class="rounded bg-slate-800 border-slate-700 text-blue-500">
            <span>Pad to Length 16 (<strong class="text-amber-400 font-mono">PAD: 0</strong>)</span>
          </label>
        </div>
      </div>

      <!-- Output Displays: Input IDs & Attention Mask -->
      <div class="space-y-4">
        <!-- Input IDs -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              Input IDs
            </h2>
            <button id="btn-copy-ids" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs rounded border border-slate-700 font-mono transition">
              Copy
            </button>
          </div>
          <div id="ml-display-ids" class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-cyan-300 break-all leading-relaxed">
            [Loading...]
          </div>
        </div>

        <!-- Attention Mask -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Attention Mask
            </h2>
            <button id="btn-copy-mask" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded border border-slate-700 font-mono transition">
              Copy
            </button>
          </div>
          <div id="ml-display-mask" class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-300 break-all leading-relaxed">
            [Loading...]
          </div>
        </div>
      </div>
    </div>
  `;

  bindMLEvents(container, tokenIds);
  computeMLOutput(tokenIds);
}

async function computeMLOutput(tokenIds) {
  const addBos = document.getElementById('ml-chk-bos')?.checked ?? true;
  const addEos = document.getElementById('ml-chk-eos')?.checked ?? true;
  const pad = document.getElementById('ml-chk-pad')?.checked ?? true;

  try {
    const res = await API.mlPreprocess(tokenIds, {
      add_bos: addBos,
      add_eos: addEos,
      max_length: pad ? 16 : 0,
      pad_to_max: pad,
      truncation: true
    });

    currentMLData = res;
    const idsBox = document.getElementById('ml-display-ids');
    const maskBox = document.getElementById('ml-display-mask');

    if (idsBox) idsBox.textContent = `Input IDs: [${res.input_ids.join(', ')}]`;
    if (maskBox) maskBox.textContent = `Attention Mask: [${res.attention_mask.join(', ')}]`;
  } catch (err) {
    store.showToast(err.message, 'error');
  }
}

function bindMLEvents(container, tokenIds) {
  const chkBos = document.getElementById('ml-chk-bos');
  const chkEos = document.getElementById('ml-chk-eos');
  const chkPad = document.getElementById('ml-chk-pad');

  [chkBos, chkEos, chkPad].forEach(el => {
    if (el) el.onchange = () => computeMLOutput(tokenIds);
  });

  document.getElementById('btn-copy-ids').onclick = () => {
    if (currentMLData) {
      navigator.clipboard.writeText(`[${currentMLData.input_ids.join(', ')}]`);
      store.showToast('Copied Input IDs!', 'info');
    }
  };

  document.getElementById('btn-copy-mask').onclick = () => {
    if (currentMLData) {
      navigator.clipboard.writeText(`[${currentMLData.attention_mask.join(', ')}]`);
      store.showToast('Copied Attention Mask!', 'info');
    }
  };
}
