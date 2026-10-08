/**
 * Tokenization Trace Page Module.
 * Timeline and detailed character-by-character trace of the maximal munch tokenizer engine.
 */

import { store } from '../store.js';

export function renderTokenTrace(container) {
  const result = store.state.lastTokenization;
  const trace = result?.trace || [];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Character-by-Character Tokenization Trace
          </h1>
          <p class="text-xs text-slate-400 mt-1">Timeline audit showing every internal state transition, longest-match backtrack, and token emission.</p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            Total Steps: <strong class="text-cyan-400">${trace.length}</strong>
          </span>
        </div>
      </div>

      <!-- Quick Trace Timeline Filter -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-300">Filter Event Type:</span>
            <select id="trace-filter-action" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
              <option value="ALL">All Events (${trace.length})</option>
              <option value="EMIT">Token Emissions Only</option>
              <option value="ADVANCE">State Advances</option>
              <option value="NO_TRANSITION">Lookahead Failures</option>
            </select>
          </div>

          <div class="text-xs text-slate-400 font-mono">
            Generated from last tokenizer run
          </div>
        </div>

        <!-- Trace Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-[560px]">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Step</th>
                <th class="py-3 px-4">Char Index</th>
                <th class="py-3 px-4">Input Char</th>
                <th class="py-3 px-4">From State</th>
                <th class="py-3 px-4">To State</th>
                <th class="py-3 px-4">Accepting?</th>
                <th class="py-3 px-4">Action / Event</th>
              </tr>
            </thead>
            <tbody id="trace-tbody" class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${renderTraceRows(trace, 'ALL')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const filterSel = document.getElementById('trace-filter-action');
  filterSel.onchange = (e) => {
    document.getElementById('trace-tbody').innerHTML = renderTraceRows(trace, e.target.value);
  };
}

function renderTraceRows(trace, filter) {
  if (!trace || trace.length === 0) {
    return `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-500 italic">
          No trace recorded yet. Run tokenization from the Tokenizer page first!
        </td>
      </tr>
    `;
  }

  const filtered = trace.filter(s => {
    if (filter === 'ALL') return true;
    if (filter === 'EMIT') return s.action.startsWith('EMIT');
    if (filter === 'ADVANCE') return s.action === 'ADVANCE';
    if (filter === 'NO_TRANSITION') return s.action === 'NO_TRANSITION';
    return true;
  });

  return filtered.map((step, idx) => {
    const isEmit = step.action.startsWith('EMIT_TOKEN');
    const isUnk = step.action.startsWith('EMIT_UNK');
    const isNoTrans = step.action === 'NO_TRANSITION';

    let rowClass = 'hover:bg-slate-900/60';
    if (isEmit) rowClass = 'bg-emerald-950/40 border-l-4 border-emerald-500';
    else if (isUnk) rowClass = 'bg-rose-950/40 border-l-4 border-rose-500';
    else if (isNoTrans) rowClass = 'bg-amber-950/20';

    return `
      <tr class="${rowClass} transition-colors">
        <td class="py-2.5 px-4 text-slate-400 font-mono">${idx + 1}</td>
        <td class="py-2.5 px-4 text-slate-300 font-mono">pos ${step.char_index}</td>
        <td class="py-2.5 px-4">
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white font-bold font-mono">
            ${escapeHtml(step.char)}
          </span>
        </td>
        <td class="py-2.5 px-4 text-slate-300 font-mono">q${step.from_state}</td>
        <td class="py-2.5 px-4 font-mono">
          ${step.to_state !== null && step.to_state >= 0 ? `<span class="text-cyan-300 font-bold">q${step.to_state}</span>` : '<span class="text-slate-500">—</span>'}
        </td>
        <td class="py-2.5 px-4">
          ${step.is_accepting ? `<span class="text-emerald-400 font-bold">YES (${step.candidate_token})</span>` : '<span class="text-slate-500">No</span>'}
        </td>
        <td class="py-2.5 px-4 font-sans font-medium ${isEmit ? 'text-emerald-300 font-bold' : isUnk ? 'text-rose-400' : isNoTrans ? 'text-amber-400' : 'text-slate-400'}">
          ${escapeHtml(step.action)}
        </td>
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
