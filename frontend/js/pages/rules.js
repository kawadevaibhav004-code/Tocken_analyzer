/**
 * Simple Regex Rules Page.
 * Displays only the 5 important token rules:
 *   - Keyword
 *   - Identifier
 *   - Integer
 *   - Operator
 *   - Whitespace
 * Keeps rules editable and allows resetting to defaults.
 */

import { store } from '../store.js';
import { API } from '../api.js';

let editingRuleId = null;

export function renderRules(container) {
  const rules = store.state.rules || [];

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <span>📜</span>
            Token Rules
          </h1>
          <p class="text-xs text-slate-400 mt-1">Core regular expressions defining the language vocabulary.</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-add-rule" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow transition">
            + Add Rule
          </button>
          <button id="btn-reset-rules" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition">
            Reset Defaults
          </button>
        </div>
      </div>

      <!-- Clean Rules Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800">
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Token Name</th>
                <th class="py-3 px-4">Pattern (Regex)</th>
                <th class="py-3 px-4">Token ID</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/60">
              ${rules.map(rule => `
                <tr class="hover:bg-slate-900/50 transition">
                  <td class="py-3 px-4 font-bold text-white font-sans">${escapeHtml(rule.name)}</td>
                  <td class="py-3 px-4 text-cyan-300 font-mono bg-slate-900/40">${escapeHtml(rule.pattern)}</td>
                  <td class="py-3 px-4 font-bold text-amber-300">${rule.token_id}</td>
                  <td class="py-3 px-4 text-slate-300">${rule.priority}</td>
                  <td class="py-3 px-4 text-right space-x-1.5">
                    <button class="rule-edit px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] transition" data-id="${rule.id}">Edit</button>
                    <button class="rule-delete px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 text-[11px] transition" data-id="${rule.id}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div id="rule-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm hidden p-4">
      <div class="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="modal-title" class="text-base font-bold text-white">Add Token Rule</h3>
          <button id="modal-close" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <form id="rule-form" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Token Name</label>
            <input type="text" id="rule-form-name" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Regex Pattern</label>
            <input type="text" id="rule-form-pattern" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono focus:outline-none focus:border-blue-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Token ID</label>
              <input type="number" id="rule-form-id" required min="10" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Priority</label>
              <input type="number" id="rule-form-priority" required min="1" value="5" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500">
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button type="button" id="modal-cancel" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Cancel</button>
            <button type="submit" id="modal-submit" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  bindRulesEvents(container);
}

function bindRulesEvents(container) {
  const modal = document.getElementById('rule-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const ruleForm = document.getElementById('rule-form');
  const btnAdd = document.getElementById('btn-add-rule');
  const btnReset = document.getElementById('btn-reset-rules');

  const openModal = (rule = null) => {
    editingRuleId = rule ? rule.id : null;
    modalTitle.textContent = rule ? `Edit Rule: ${rule.name}` : 'Add Token Rule';
    document.getElementById('rule-form-name').value = rule ? rule.name : '';
    document.getElementById('rule-form-pattern').value = rule ? rule.pattern : '';
    document.getElementById('rule-form-id').value = rule ? rule.token_id : '';
    document.getElementById('rule-form-priority').value = rule ? rule.priority : '5';
    modal.classList.remove('hidden');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    editingRuleId = null;
  };

  btnAdd.onclick = () => openModal();
  modalClose.onclick = closeModal;
  modalCancel.onclick = closeModal;

  ruleForm.onsubmit = async (e) => {
    e.preventDefault();
    const ruleData = {
      name: document.getElementById('rule-form-name').value.trim().toUpperCase(),
      pattern: document.getElementById('rule-form-pattern').value.trim(),
      token_id: Number(document.getElementById('rule-form-id').value),
      priority: Number(document.getElementById('rule-form-priority').value),
      enabled: true
    };

    try {
      if (editingRuleId) {
        await API.updateRule(editingRuleId, ruleData);
        store.showToast(`Updated '${ruleData.name}'!`, 'success');
      } else {
        await API.addRule(ruleData);
        store.showToast(`Added '${ruleData.name}'!`, 'success');
      }
      closeModal();
      const rulesRes = await API.getRules();
      store.setRules(rulesRes.rules);
      renderRules(container);
    } catch (err) {
      store.showToast(err.message, 'error');
    }
  };

  container.querySelectorAll('.rule-edit').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const rule = store.state.rules.find(r => r.id === id);
      if (rule) openModal(rule);
    };
  });

  container.querySelectorAll('.rule-delete').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const rule = store.state.rules.find(r => r.id === id);
      if (!rule) return;
      if (confirm(`Delete rule '${rule.name}'?`)) {
        try {
          await API.deleteRule(id);
          store.showToast(`Deleted '${rule.name}'.`, 'success');
          const rulesRes = await API.getRules();
          store.setRules(rulesRes.rules);
          renderRules(container);
        } catch (err) {
          store.showToast(err.message, 'error');
        }
      }
    };
  });

  btnReset.onclick = async () => {
    if (confirm('Reset to the 5 standard default rules?')) {
      try {
        const res = await API.resetRules();
        store.setRules(res.rules);
        store.showToast('Reset to default rules!', 'success');
        renderRules(container);
      } catch (err) {
        store.showToast(err.message, 'error');
      }
    }
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
