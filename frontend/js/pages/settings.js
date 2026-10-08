/**
 * Settings Page Module.
 * Persistent system configuration, tokenization behavior, and theme management.
 */

import { store } from '../store.js';
import { API } from '../api.js';

export function renderSettings(container) {
  const settings = store.state.settings || {
    longest_match: true,
    priority_resolution: true,
    unknown_token_id: 1,
    unknown_handling: "fallback_single_char",
    add_bos: true,
    add_eos: true,
    pad_token_id: 0,
    max_sequence_length: 64,
    padding_strategy: "max_length",
    truncation: true,
    theme: store.state.theme
  };

  container.innerHTML = `
    <div class="space-y-6 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            System & Engine Settings
          </h1>
          <p class="text-xs text-slate-400 mt-1">Configure tokenizer engine behavior, token policies, and persistent preferences.</p>
        </div>

        <button id="btn-save-settings" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow transition">
          Save Configuration
        </button>
      </div>

      <!-- Engine Behavior Section -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider">Automata Tokenizer Engine</h2>

        <div class="space-y-3 text-xs">
          <label class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
            <div>
              <div class="font-semibold text-slate-200">Longest-Match (Maximal Munch)</div>
              <div class="text-slate-400">Continue scanning until DFA transition failure, then emit longest accepted prefix.</div>
            </div>
            <input type="checkbox" id="set-longest-match" ${settings.longest_match ? 'checked' : ''} class="rounded bg-slate-800 border-slate-700 text-blue-500">
          </label>

          <label class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
            <div>
              <div class="font-semibold text-slate-200">Deterministic Priority Resolution</div>
              <div class="text-slate-400">Break ties using lowest numerical rule priority rank when multiple rules match.</div>
            </div>
            <input type="checkbox" id="set-priority" ${settings.priority_resolution ? 'checked' : ''} class="rounded bg-slate-800 border-slate-700 text-blue-500">
          </label>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-slate-200">Unknown Character (UNK) Token ID</div>
              <div class="text-slate-400">Reserved fallback integer ID when no transition exists.</div>
            </div>
            <input type="number" id="set-unk-id" value="${settings.unknown_token_id ?? 1}" class="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-amber-300 font-mono">
          </div>
        </div>
      </div>

      <!-- ML Preprocessing Defaults -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider">ML Preprocessing Defaults</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <label class="font-semibold text-slate-200 block">Default Max Sequence Length</label>
            <input type="number" id="set-max-len" value="${settings.max_sequence_length ?? 64}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono">
          </div>

          <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <label class="font-semibold text-slate-200 block">PAD Token ID</label>
            <input type="number" id="set-pad-id" value="${settings.pad_token_id ?? 0}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-mono">
          </div>
        </div>
      </div>

      <!-- Theme & Appearance -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider">UI Appearance & Theme</h2>
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <div class="font-semibold text-slate-200">Color Theme</div>
            <div class="text-slate-400">Toggle between Dark Mode and Light Mode.</div>
          </div>
          <button id="btn-settings-toggle-theme" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono">
            ${store.state.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>
    </div>
  `;

  bindSettingsEvents(container);
}

function bindSettingsEvents(container) {
  const btnSave = document.getElementById('btn-save-settings');
  const btnTheme = document.getElementById('btn-settings-toggle-theme');

  btnTheme.onclick = () => {
    store.toggleTheme();
    btnTheme.textContent = store.state.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
  };

  btnSave.onclick = async () => {
    const updated = {
      longest_match: document.getElementById('set-longest-match').checked,
      priority_resolution: document.getElementById('set-priority').checked,
      unknown_token_id: Number(document.getElementById('set-unk-id').value),
      max_sequence_length: Number(document.getElementById('set-max-len').value),
      pad_token_id: Number(document.getElementById('set-pad-id').value),
      theme: store.state.theme
    };

    try {
      await API.updateSettings(updated);
      store.state.settings = updated;
      store.showToast('System configuration saved persistently!', 'success');
    } catch (err) {
      store.showToast(err.message, 'error');
    }
  };
}
