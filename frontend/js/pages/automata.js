/**
 * Consolidated Automata Page.
 * Combines NFA, DFA, and Minimized DFA into ONE clean, easy-to-understand page.
 * Flow: Regex Rules → Thompson NFA → Subset Construction DFA → Minimized DFA.
 */

import { store } from '../store.js';

export function renderAutomata(container) {
  const nfa = store.state.nfa;
  const dfa = store.state.dfa;
  const minDfa = store.state.minimizedDfa;
  const stats = store.state.pipelineStats || {};

  container.innerHTML = `
    <div class="space-y-6 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800">
        <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
          <span class="text-xl">⚙️</span>
          Finite Automata Pipeline
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Complete deterministic pipeline: <strong>Regex Rules → Thompson NFA → Subset DFA → Minimized DFA</strong>
        </p>
      </div>

      <!-- Simple Pipeline Flow Banner -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">Step 1</span>
          <strong class="text-sm text-white block">Regex Rules</strong>
          <span class="text-xs text-slate-400 font-mono">${store.state.rules?.length || 0} Patterns</span>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Step 2</span>
          <strong class="text-sm text-white block">Thompson NFA</strong>
          <span class="text-xs text-blue-300 font-mono">${stats.nfa_states ?? nfa?.total_states ?? 0} States</span>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Step 3</span>
          <strong class="text-sm text-white block">Subset DFA</strong>
          <span class="text-xs text-cyan-300 font-mono">${stats.dfa_states ?? dfa?.total_states ?? 0} States</span>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Step 4</span>
          <strong class="text-sm text-white block">Minimized DFA</strong>
          <span class="text-xs text-emerald-400 font-mono">${stats.minimized_dfa_states ?? minDfa?.total_states ?? 0} States (${stats.state_reduction_pct ?? 0}% off)</span>
        </div>
      </div>

      <!-- Section 1: Thompson NFA -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            1. Thompson's Construction NFA
          </h2>
          <span class="text-xs font-mono text-slate-400">ε-Transitions & Linear States</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Inductively generates states and ε-transitions for each regular expression rule without backtracking.
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-sans">Total States</span>
            <strong class="text-white text-base">${nfa?.total_states ?? 0}</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-sans">Start State</span>
            <strong class="text-blue-400 text-base">s${nfa?.start_state ?? 0}</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-sans">Accepting States</span>
            <strong class="text-emerald-400 text-base">${nfa?.accept_states?.length ?? 0}</strong>
          </div>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-sans">Total Transitions</span>
            <strong class="text-cyan-400 text-base">${nfa?.transitions?.length ?? 0}</strong>
          </div>
        </div>
      </div>

      <!-- Section 2: Subset Construction DFA -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            2. Subset Construction DFA
          </h2>
          <span class="text-xs font-mono text-slate-400">Deterministic Powerset Construction</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Eliminates non-determinism by computing ε-closure and move operations. Each DFA state represents a unique set of NFA states.
        </p>

        <!-- Subset Mapping Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-56">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-2 px-3">DFA State</th>
                <th class="py-2 px-3">NFA States Set</th>
                <th class="py-2 px-3">Accepting Token</th>
                <th class="py-2 px-3">Token ID</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/60">
              ${(dfa?.transition_table || []).slice(0, 10).map(r => `
                <tr class="hover:bg-slate-900/50">
                  <td class="py-2 px-3 font-bold text-white">q${r.state_id}</td>
                  <td class="py-2 px-3 text-purple-300">{ ${r.nfa_states.map(s => `s${s}`).join(', ')} }</td>
                  <td class="py-2 px-3 ${r.is_accept ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">${r.token_name || '—'}</td>
                  <td class="py-2 px-3 text-amber-300">${r.token_id ?? '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 3: Minimized DFA -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            3. Minimized DFA (Hopcroft Algorithm)
          </h2>
          <span class="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">${stats.state_reduction_pct ?? 0}% Reduction</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Partitions states to eliminate redundant and unreachable states while preserving token classes.
        </p>

        <!-- Simple Transition Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-56">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-2 px-3">State</th>
                <th class="py-2 px-3">Status</th>
                <th class="py-2 px-3">Token</th>
                <th class="py-2 px-3">Transitions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/60">
              ${(minDfa?.transition_table || []).map(r => `
                <tr class="hover:bg-slate-900/50">
                  <td class="py-2 px-3 font-bold text-white">q${r.state_id}</td>
                  <td class="py-2 px-3">
                    ${r.is_start ? '<span class="text-blue-400 font-bold">START</span>' : r.is_accept ? '<span class="text-emerald-400 font-bold">ACCEPT</span>' : '<span class="text-slate-500">Normal</span>'}
                  </td>
                  <td class="py-2 px-3 text-emerald-300 font-semibold">${r.token_name || '—'}</td>
                  <td class="py-2 px-3">
                    <div class="flex flex-wrap gap-1">
                      ${r.transitions.map(t => `
                        <span class="px-1.5 py-0.5 bg-slate-900 rounded text-[11px] text-cyan-300 border border-slate-800">
                          ${t.display_label} → q${t.to_state}
                        </span>
                      `).join('')}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
