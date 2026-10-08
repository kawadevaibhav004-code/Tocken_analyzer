/**
 * Vocabulary Manager Page Module.
 * Full CRUD, unique ID validation, reserved IDs (PAD=0, UNK=1, BOS=2, EOS=3, MASK=4),
 * frequency counters, and JSON/CSV import/export.
 */

import { store } from '../store.js';
import { API } from '../api.js';

let vocabSearchQuery = '';
let vocabTypeFilter = 'ALL';
let editingVocabToken = null;

export function renderVocabulary(container) {
  const vocab = store.state.vocabulary;
  const tokens = vocab?.tokens || [];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            Vocabulary System & Token ID Mapping
          </h1>
          <p class="text-xs text-slate-400 mt-1">Deterministic vocabulary management with reserved special IDs, subword symbols, and frequencies.</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <button id="btn-add-vocab-token" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow transition flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Token
          </button>
          <button id="btn-import-vocab-file" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Import JSON/CSV
          </button>
          <input type="file" id="vocab-file-input" class="hidden" accept=".json,.csv">
          
          <div class="relative group">
            <button class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export ▼
            </button>
            <div class="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl hidden group-hover:block z-30 py-1 text-xs">
              <a href="/api/vocabulary/export/json" download="vocabulary.json" class="block px-3 py-1.5 hover:bg-slate-800 text-slate-200">Export as JSON</a>
              <a href="/api/vocabulary/export/csv" download="vocabulary.csv" class="block px-3 py-1.5 hover:bg-slate-800 text-slate-200">Export as CSV</a>
            </div>
          </div>

          <button id="btn-reset-vocab" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition">
            Reset
          </button>
        </div>
      </div>

      <!-- Reserved Special Tokens Showcase -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800">
        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Reserved Special Tokens (Locked IDs 0–4)</span>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <div class="flex items-center justify-between text-slate-400 text-xs"><span>PAD</span><span class="text-amber-400 font-bold">ID: 0</span></div>
            <div class="text-[10px] text-slate-500 font-sans mt-1">Batch tensor alignment</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <div class="flex items-center justify-between text-slate-400 text-xs"><span>UNK</span><span class="text-amber-400 font-bold">ID: 1</span></div>
            <div class="text-[10px] text-slate-500 font-sans mt-1">Unknown/out-of-vocab fallback</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <div class="flex items-center justify-between text-slate-400 text-xs"><span>BOS</span><span class="text-amber-400 font-bold">ID: 2</span></div>
            <div class="text-[10px] text-slate-500 font-sans mt-1">Beginning of Sequence marker</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <div class="flex items-center justify-between text-slate-400 text-xs"><span>EOS</span><span class="text-amber-400 font-bold">ID: 3</span></div>
            <div class="text-[10px] text-slate-500 font-sans mt-1">End of Sequence marker</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <div class="flex items-center justify-between text-slate-400 text-xs"><span>MASK</span><span class="text-amber-400 font-bold">ID: 4</span></div>
            <div class="text-[10px] text-slate-500 font-sans mt-1">Masked LM fill placeholder</div>
          </div>
        </div>
      </div>

      <!-- Vocabulary Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <!-- Toolbar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-bold text-white">Vocabulary Registry</h2>
            <span class="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">${tokens.length} total entries</span>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <!-- Search -->
            <input type="text" id="vocab-search" placeholder="Search token or ID..." value="${vocabSearchQuery}" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44">

            <!-- Filter Type -->
            <select id="vocab-type-filter" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500">
              <option value="ALL">All Types</option>
              <option value="SPECIAL" ${vocabTypeFilter === 'SPECIAL' ? 'selected' : ''}>SPECIAL</option>
              <option value="RULE" ${vocabTypeFilter === 'RULE' ? 'selected' : ''}>RULE</option>
              <option value="CUSTOM" ${vocabTypeFilter === 'CUSTOM' ? 'selected' : ''}>CUSTOM / LEXEME</option>
            </select>
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Token Symbol</th>
                <th class="py-3 px-4">Token ID</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Associated Regex</th>
                <th class="py-3 px-4">Frequency</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="vocab-tbody" class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${renderVocabRows(tokens)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Vocab Add/Edit Modal -->
    <div id="vocab-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm hidden p-4">
      <div class="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="vocab-modal-title" class="text-lg font-bold text-white">Add Vocabulary Token</h3>
          <button id="vocab-modal-close" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <form id="vocab-form" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Token Name / Lexeme</label>
            <input type="text" id="vocab-form-token" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Unique Token ID</label>
            <input type="number" id="vocab-form-id" required min="5" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Token Type</label>
            <select id="vocab-form-type" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500">
              <option value="CUSTOM">CUSTOM (Lexeme / Subword)</option>
              <option value="RULE">RULE</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Optional Regex Pattern</label>
            <input type="text" id="vocab-form-regex" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono focus:outline-none focus:border-emerald-500">
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button type="button" id="vocab-modal-cancel" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Cancel</button>
            <button type="submit" id="vocab-modal-submit" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition">Save Token</button>
          </div>
        </form>
      </div>
    </div>
  `;

  bindVocabEvents(container);
}

function bindVocabEvents(container) {
  const modal = document.getElementById('vocab-modal');
  const modalTitle = document.getElementById('vocab-modal-title');
  const modalClose = document.getElementById('vocab-modal-close');
  const modalCancel = document.getElementById('vocab-modal-cancel');
  const vocabForm = document.getElementById('vocab-form');
  const btnAdd = document.getElementById('btn-add-vocab-token');
  const btnReset = document.getElementById('btn-reset-vocab');
  const btnImport = document.getElementById('btn-import-vocab-file');
  const fileInput = document.getElementById('vocab-file-input');

  const searchInput = document.getElementById('vocab-search');
  const filterSelect = document.getElementById('vocab-type-filter');

  searchInput.oninput = (e) => {
    vocabSearchQuery = e.target.value;
    updateVocabTable();
  };

  filterSelect.onchange = (e) => {
    vocabTypeFilter = e.target.value;
    updateVocabTable();
  };

  const openModal = (token = null) => {
    editingVocabToken = token ? token.token : null;
    modalTitle.textContent = token ? `Edit Token: ${token.token}` : 'Add Vocabulary Token';
    document.getElementById('vocab-form-token').value = token ? token.token : '';
    document.getElementById('vocab-form-id').value = token ? token.id : '';
    document.getElementById('vocab-form-type').value = token ? token.type : 'CUSTOM';
    document.getElementById('vocab-form-regex').value = token ? (token.regex || '') : '';
    modal.classList.remove('hidden');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    editingVocabToken = null;
  };

  btnAdd.onclick = () => openModal();
  modalClose.onclick = closeModal;
  modalCancel.onclick = closeModal;

  vocabForm.onsubmit = async (e) => {
    e.preventDefault();
    const tokenData = {
      token: document.getElementById('vocab-form-token').value.trim(),
      id: Number(document.getElementById('vocab-form-id').value),
      type: document.getElementById('vocab-form-type').value,
      regex: document.getElementById('vocab-form-regex').value.trim()
    };

    try {
      if (editingVocabToken) {
        await API.updateVocabToken(editingVocabToken, tokenData);
        store.showToast(`Updated token '${tokenData.token}'!`, 'success');
      } else {
        await API.addVocabToken(tokenData);
        store.showToast(`Added token '${tokenData.token}'!`, 'success');
      }
      closeModal();
      const updatedVocab = await API.getVocabulary();
      store.setVocabulary(updatedVocab);
      renderVocabulary(container);
    } catch (err) {
      store.showToast(err.message, 'error');
    }
  };

  btnReset.onclick = async () => {
    if (confirm('Reset vocabulary back to standard default IDs?')) {
      try {
        const res = await API.resetVocabulary();
        store.setVocabulary(res.vocabulary);
        store.showToast('Vocabulary reset successfully!', 'success');
        renderVocabulary(container);
      } catch (err) {
        store.showToast(err.message, 'error');
      }
    }
  };

  btnImport.onclick = () => fileInput.click();
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target.result;
      const isCsv = file.name.endsWith('.csv');
      try {
        const res = await API.importVocabulary(content, isCsv ? 'csv' : 'json');
        store.showToast(`Imported ${res.imported} tokens successfully!`, 'success');
        const updatedVocab = await API.getVocabulary();
        store.setVocabulary(updatedVocab);
        renderVocabulary(container);
      } catch (err) {
        store.showToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
  };
}

function updateVocabTable() {
  const tbody = document.getElementById('vocab-tbody');
  const tokens = store.state.vocabulary?.tokens || [];
  if (tbody) tbody.innerHTML = renderVocabRows(tokens);
}

function renderVocabRows(tokens) {
  const filtered = tokens.filter(t => {
    const matchesSearch = !vocabSearchQuery ||
      t.token.toLowerCase().includes(vocabSearchQuery.toLowerCase()) ||
      String(t.id).includes(vocabSearchQuery);
    const matchesType = vocabTypeFilter === 'ALL' || t.type === vocabTypeFilter;
    return matchesSearch && matchesType;
  });

  if (filtered.length === 0) {
    return `<tr><td colspan="7" class="text-center py-8 text-slate-500 italic">No vocabulary tokens match filter.</td></tr>`;
  }

  return filtered.map(t => {
    const isLocked = t.status === 'locked';
    return `
      <tr class="hover:bg-slate-900/60 transition-colors">
        <td class="py-2.5 px-4 font-bold text-white">${escapeHtml(t.token)}</td>
        <td class="py-2.5 px-4 font-bold text-amber-300 font-mono">${t.id}</td>
        <td class="py-2.5 px-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${t.type === 'SPECIAL' ? 'bg-purple-950 text-purple-300 border border-purple-800' : t.type === 'RULE' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">${t.type}</span>
        </td>
        <td class="py-2.5 px-4 font-mono text-cyan-300 text-[11px] truncate max-w-xs">${escapeHtml(t.regex || '—')}</td>
        <td class="py-2.5 px-4 text-slate-300">${t.frequency || 0}</td>
        <td class="py-2.5 px-4">
          ${isLocked ? '<span class="text-slate-500 font-semibold text-[10px]">LOCKED</span>' : '<span class="text-emerald-400 font-semibold text-[10px]">ACTIVE</span>'}
        </td>
        <td class="py-2.5 px-4 text-right space-x-2">
          ${!isLocked ? `
            <button class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px]" onclick="editTokenModal('${escapeHtml(t.token)}')">Edit</button>
            <button class="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 text-[10px]" onclick="deleteTokenAction('${escapeHtml(t.token)}')">Delete</button>
          ` : '<span class="text-slate-600 text-[10px]">Reserved</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

window.editTokenModal = (tokenName) => {
  const t = (store.state.vocabulary?.tokens || []).find(item => item.token === tokenName);
  if (t) {
    document.getElementById('vocab-modal-title').textContent = `Edit Token: ${t.token}`;
    document.getElementById('vocab-form-token').value = t.token;
    document.getElementById('vocab-form-id').value = t.id;
    document.getElementById('vocab-form-type').value = t.type;
    document.getElementById('vocab-form-regex').value = t.regex || '';
    document.getElementById('vocab-modal').classList.remove('hidden');
  }
};

window.deleteTokenAction = async (tokenName) => {
  if (confirm(`Delete token '${tokenName}' from vocabulary?`)) {
    try {
      await API.deleteVocabToken(tokenName);
      store.showToast(`Deleted token '${tokenName}'.`, 'success');
      const updatedVocab = await API.getVocabulary();
      store.setVocabulary(updatedVocab);
      updateVocabTable();
    } catch (err) {
      store.showToast(err.message, 'error');
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
