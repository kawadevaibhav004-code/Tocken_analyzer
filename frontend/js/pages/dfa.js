/**
 * DFA Page - Subset Construction Visualizer.
 * Displays canonical DFA generated from Thompson NFA via powerset construction.
 * Shows exact NFA state subsets mapped to each DFA state, transition matrix,
 * token priority conflicts, and interactive graph.
 */

import { store } from '../store.js';
import { AutomataGraph } from '../components/graph.js';

let dfaGraphInstance = null;

export function renderDFA(container) {
  const dfa = store.state.dfa;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Subset Construction DFA (Canonical Powerset)
          </h1>
          <p class="text-xs text-slate-400 mt-1">Determinization of Thompson NFA through ε-closure and Move operations over active alphabet classes.</p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-800 font-mono">
            Alphabet Size: ${dfa?.alphabet_size || 0}
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
            Deterministic: 100%
          </span>
        </div>
      </div>

      <!-- Quick Stats Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">DFA States</span>
          <div class="text-xl font-bold text-white font-mono mt-0.5">${dfa?.total_states ?? '--'}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Start State</span>
          <div class="text-xl font-bold text-blue-400 font-mono mt-0.5">q${dfa?.start_state_id ?? 0}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Accepting States</span>
          <div class="text-xl font-bold text-emerald-400 font-mono mt-0.5">${dfa?.accept_states?.length ?? 0}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Grouped Transitions</span>
          <div class="text-xl font-bold text-cyan-400 font-mono mt-0.5">${dfa?.transitions?.length ?? 0}</div>
        </div>
      </div>

      <!-- Graph Canvas + State Detail Drawer -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Interactive Graph -->
        <div class="lg:col-span-8 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs font-bold text-slate-300">DFA State Graph (Directed deterministic edges)</span>
            <span class="text-[11px] text-slate-500 font-mono">Double circle = Accepting</span>
          </div>
          <div id="dfa-graph-canvas" class="w-full h-[520px]"></div>
        </div>

        <!-- Selected State Detail Drawer -->
        <div class="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              DFA State Inspector
            </h2>
            <div id="dfa-state-inspector" class="mt-3 text-xs space-y-3">
              <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-center italic">
                Click on any state node (q0, q1...) to inspect its constituent NFA states and priority resolution.
              </div>
            </div>
          </div>

          <!-- Theory note -->
          <div class="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300 leading-relaxed space-y-1">
            <strong class="font-semibold text-blue-200">Subset Construction Principle:</strong>
            <p>Every DFA state represents a unique mathematical subset of NFA states: <code>D = ε-closure(move(T, a))</code>. Exactly one transition exists for each symbol.</p>
          </div>
        </div>
      </div>

      <!-- Subset Construction Mapping Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-white">Subset Construction: DFA State → NFA States Mapping</h2>
          <span class="text-xs text-slate-400 font-mono">Deterministic State Map</span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">DFA State</th>
                <th class="py-3 px-4">Constituent NFA States</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Accepting Token</th>
                <th class="py-3 px-4">Token ID</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Transitions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${(dfa?.transition_table || []).map(row => `
                <tr class="hover:bg-slate-900/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-white">q${row.state_id}</td>
                  <td class="py-2.5 px-4 font-mono text-purple-300">
                    { ${row.nfa_states.map(s => `s${s}`).join(', ')} }
                  </td>
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

  initDFAGraph(dfa);
}

function initDFAGraph(dfaData) {
  if (!dfaData) return;
  dfaGraphInstance = new AutomataGraph('dfa-graph-canvas', {
    isNFA: false,
    onNodeClick: (node) => inspectDFAState(node, dfaData)
  });
  dfaGraphInstance.setData(dfaData, false);
}

function inspectDFAState(node, dfaData) {
  const inspector = document.getElementById('dfa-state-inspector');
  if (!inspector) return;

  const row = (dfaData.transition_table || []).find(r => r.state_id === node.id);

  inspector.innerHTML = `
    <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <span class="text-base font-bold text-white">State q${node.id}</span>
        ${node.isStart ? '<span class="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px]">Start State</span>' : ''}
        ${node.isAccept ? '<span class="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px]">Accepting</span>' : ''}
      </div>

      <div>
        <div class="text-[11px] font-sans text-slate-400 uppercase font-semibold mb-1">NFA Subset Members:</div>
        <div class="p-2 rounded bg-slate-900 border border-slate-800 text-purple-300 text-xs">
          { ${(node.nfaStates || []).map(s => `s${s}`).join(', ')} }
        </div>
      </div>

      ${node.isAccept ? `
        <div class="space-y-1.5 pt-1 text-xs">
          <div class="text-slate-400">Winning Rule: <strong class="text-emerald-300">${node.tokenName}</strong></div>
          <div class="text-slate-400">Token ID: <strong class="text-amber-300">${node.tokenId}</strong></div>
          <div class="text-slate-400">Priority: <strong class="text-white">${node.priority}</strong></div>

          ${(node.candidates && node.candidates.length > 1) ? `
            <div class="mt-2 pt-2 border-t border-slate-800">
              <span class="text-[10px] text-amber-400 font-sans uppercase font-bold">Priority Conflict Resolved:</span>
              <div class="space-y-1 mt-1">
                ${node.candidates.map((c, idx) => `
                  <div class="flex items-center justify-between text-[11px] ${idx === 0 ? 'text-emerald-300 font-bold' : 'text-slate-500 line-through'}">
                    <span>${c.token_name} (priority ${c.priority})</span>
                    <span>${idx === 0 ? 'WINNER' : 'SUPPRESSED'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : '<div class="text-xs text-slate-500 italic">Non-accepting state.</div>'}

      <div class="pt-2 border-t border-slate-800">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-sans">Transitions (${row?.transitions?.length || 0})</div>
        <div class="space-y-1.5 max-h-40 overflow-y-auto">
          ${(row?.transitions || []).map(t => `
            <div class="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span class="text-cyan-300 font-semibold">${t.display_label}</span>
              <span class="text-slate-400">→ q${t.to_state}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
