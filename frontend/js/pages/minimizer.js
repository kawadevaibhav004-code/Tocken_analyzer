/**
 * DFA Minimizer Page.
 * Displays before/after comparison between canonical DFA and Minimized DFA
 * using Hopcroft / Moore partition refinement.
 */

import { store } from '../store.js';
import { AutomataGraph } from '../components/graph.js';

let minGraphInstance = null;

export function renderMinimizer(container) {
  const dfa = store.state.dfa;
  const minDfa = store.state.minimizedDfa;
  const stats = store.state.pipelineStats || {};

  const origStates = stats.dfa_states || dfa?.total_states || 0;
  const minStates = stats.minimized_dfa_states || minDfa?.total_states || 0;
  const reductionPct = stats.state_reduction_pct || 0;
  const statesRemoved = stats.states_removed || Math.max(0, origStates - minStates);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            DFA Minimization (Hopcroft / Partition Refinement)
          </h1>
          <p class="text-xs text-slate-400 mt-1">Computes the unique minimal equivalent DFA by merging indistinguishable states and pruning unreachable states.</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            ${reductionPct}% State Reduction
          </span>
        </div>
      </div>

      <!-- Before / After Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-xs font-medium text-slate-400 uppercase">Original DFA States</span>
          <div class="text-2xl font-bold text-slate-200 font-mono mt-1">${origStates}</div>
          <span class="text-[11px] text-slate-500 font-sans">Before minimization</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-xs font-medium text-slate-400 uppercase">Minimized DFA States</span>
          <div class="text-2xl font-bold text-emerald-400 font-mono mt-1">${minStates}</div>
          <span class="text-[11px] text-emerald-500 font-semibold font-sans">Optimal minimal automaton</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-xs font-medium text-slate-400 uppercase">States Removed</span>
          <div class="text-2xl font-bold text-cyan-400 font-mono mt-1">${statesRemoved}</div>
          <span class="text-[11px] text-slate-500 font-sans">Redundant / merged</span>
        </div>

        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-xs font-medium text-slate-400 uppercase">Minimization Time</span>
          <div class="text-2xl font-bold text-amber-300 font-mono mt-1">${stats.minimization_time_ms ?? 0} <span class="text-xs text-slate-400 font-sans font-normal">ms</span></div>
          <span class="text-[11px] text-slate-500 font-sans">Hopcroft execution</span>
        </div>
      </div>

      <!-- Minimized Graph Canvas -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Optimized Minimized DFA Graph
          </h2>
          <span class="text-xs text-slate-400 font-mono">Guaranteed Minimal States</span>
        </div>
        <div id="min-dfa-graph-canvas" class="w-full h-[520px]"></div>
      </div>

      <!-- Minimized DFA Transition Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-base font-bold text-white">Minimized DFA State Table</h2>
        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">State</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Accepts Token</th>
                <th class="py-3 px-4">Token ID</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Transitions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${(minDfa?.transition_table || []).map(row => `
                <tr class="hover:bg-slate-900/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-white">q${row.state_id}</td>
                  <td class="py-2.5 px-4">
                    ${row.is_start ? '<span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">START</span> ' : ''}
                    ${row.is_accept ? '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACCEPT</span>' : '<span class="text-slate-500">Normal</span>'}
                  </td>
                  <td class="py-2.5 px-4 font-semibold text-emerald-300">${row.token_name || '--'}</td>
                  <td class="py-2.5 px-4 text-amber-300">${row.token_id ?? '--'}</td>
                  <td class="py-2.5 px-4 text-slate-400">${row.priority ?? '--'}</td>
                  <td class="py-2.5 px-4">
                    <div class="flex flex-wrap gap-1.5">
                      ${row.transitions.map(t => `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-cyan-300 border border-slate-700">
                          <strong>${t.display_label}</strong> → q${t.to_state}
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

  initMinGraph(minDfa);
}

function initMinGraph(minDfaData) {
  if (!minDfaData) return;
  minGraphInstance = new AutomataGraph('min-dfa-graph-canvas', {
    isNFA: false
  });
  minGraphInstance.setData(minDfaData, false);
}
