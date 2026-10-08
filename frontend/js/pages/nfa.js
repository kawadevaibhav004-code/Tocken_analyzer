/**
 * NFA Page - Thompson's Construction Visualizer.
 * Visualizes the unified Lexer NFA or isolated regex NFA with states,
 * epsilon transitions, start arrow, and transition table.
 */

import { store } from '../store.js';
import { API } from '../api.js';
import { AutomataGraph } from '../components/graph.js';

let graphInstance = null;
let selectedNFAState = null;

export function renderNFA(container) {
  const nfa = store.state.nfa;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            Thompson's Construction NFA Visualizer
          </h1>
          <p class="text-xs text-slate-400 mt-1">Non-deterministic finite automaton constructed inductively from formal regular expressions.</p>
        </div>

        <!-- Custom Single-Regex Sandbox -->
        <div class="flex items-center gap-2">
          <input type="text" id="nfa-sandbox-pattern" placeholder="Test any regex (e.g. (a|b)*abb)..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-500 w-64 focus:outline-none focus:border-purple-500">
          <button id="btn-build-sandbox-nfa" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow transition">
            Build NFA
          </button>
          <button id="btn-show-full-lexer-nfa" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition">
            Full Lexer NFA
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Total NFA States</span>
          <div class="text-xl font-bold text-white font-mono mt-0.5">${nfa?.total_states ?? '--'}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Start State</span>
          <div class="text-xl font-bold text-blue-400 font-mono mt-0.5">s${nfa?.start_state ?? 0}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">Accepting States</span>
          <div class="text-xl font-bold text-emerald-400 font-mono mt-0.5">${nfa?.accept_states?.length ?? 0}</div>
        </div>
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span class="text-[11px] font-medium text-slate-400 uppercase">ε-Transitions</span>
          <div class="text-xl font-bold text-purple-400 font-mono mt-0.5">${nfa?.transitions?.filter(t => t.is_epsilon)?.length ?? 0}</div>
        </div>
      </div>

      <!-- Graph Canvas + State Detail Drawer -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Interactive Graph Container -->
        <div class="lg:col-span-8 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs font-bold text-slate-300">NFA State Graph (Zoom / Pan / Drag nodes)</span>
            <span class="text-[11px] text-slate-500 font-mono">ε = epsilon transition</span>
          </div>
          <div id="nfa-graph-canvas" class="w-full h-[520px]"></div>
        </div>

        <!-- Selected State Detail Drawer -->
        <div class="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              State Inspector
            </h2>
            <div id="nfa-state-inspector" class="mt-3 text-xs space-y-3">
              <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-center italic">
                Click on any state circle in the graph to inspect its outgoing transitions and token bindings.
              </div>
            </div>
          </div>

          <!-- Thompson Theory Callout -->
          <div class="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 leading-relaxed space-y-1">
            <strong class="font-semibold text-purple-200">Thompson's Construction:</strong>
            <p>Each regex fragment is inductively translated into an NFA with exactly 1 start state and 1 accepting state connected through ε-transitions, preserving O(N) states.</p>
          </div>
        </div>
      </div>

      <!-- NFA Transition Matrix Table -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-base font-bold text-white">NFA State Transition Table</h2>
        <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">State</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Accepts Token</th>
                <th class="py-3 px-4">Token ID</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Outgoing Transitions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${(nfa?.transition_table || []).map(row => `
                <tr class="hover:bg-slate-900/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-white">s${row.state}</td>
                  <td class="py-2.5 px-4">
                    ${row.is_start ? '<span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">START</span> ' : ''}
                    ${row.is_accept ? '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACCEPT</span>' : '<span class="text-slate-500">Normal</span>'}
                  </td>
                  <td class="py-2.5 px-4 font-semibold text-emerald-300">${row.accept_meta?.token_name || '--'}</td>
                  <td class="py-2.5 px-4 text-amber-300">${row.accept_meta?.token_id ?? '--'}</td>
                  <td class="py-2.5 px-4 text-slate-400">${row.accept_meta?.priority ?? '--'}</td>
                  <td class="py-2.5 px-4">
                    <div class="flex flex-wrap gap-1.5">
                      ${row.transitions.map(t => `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${t.is_epsilon ? 'bg-purple-950/70 text-purple-300 border border-purple-800' : 'bg-slate-800 text-cyan-300 border border-slate-700'}">
                          <strong>${t.label}</strong> → s${t.to}
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

  initNFAGraph(nfa);
  bindNFAEvents(container);
}

function initNFAGraph(nfaData) {
  if (!nfaData) return;
  graphInstance = new AutomataGraph('nfa-graph-canvas', {
    isNFA: true,
    onNodeClick: (node) => inspectState(node, nfaData)
  });
  graphInstance.setData(nfaData, true);
}

function inspectState(node, nfaData) {
  const inspector = document.getElementById('nfa-state-inspector');
  if (!inspector) return;

  const outgoing = (nfaData.transitions || []).filter(t => t.from_state === node.id);

  inspector.innerHTML = `
    <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <span class="text-base font-bold text-white">State s${node.id}</span>
        ${node.isStart ? '<span class="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px]">Start State</span>' : ''}
        ${node.isAccept ? '<span class="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px]">Accepting State</span>' : ''}
      </div>

      ${node.isAccept ? `
        <div class="space-y-1 text-xs">
          <div class="text-slate-400">Winning Token: <strong class="text-emerald-300">${node.tokenName}</strong></div>
          <div class="text-slate-400">Token ID: <strong class="text-amber-300">${node.tokenId}</strong></div>
          <div class="text-slate-400">Priority: <strong class="text-white">${node.priority}</strong></div>
        </div>
      ` : '<div class="text-xs text-slate-500 italic">Non-accepting intermediate state.</div>'}

      <div class="pt-2 border-t border-slate-800">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-sans">Outgoing Transitions (${outgoing.length})</div>
        <div class="space-y-1.5 max-h-40 overflow-y-auto">
          ${outgoing.length > 0 ? outgoing.map(t => `
            <div class="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span class="${t.is_epsilon ? 'text-purple-300 font-bold' : 'text-cyan-300 font-semibold'}">${t.display_label}</span>
              <span class="text-slate-400">→ s${t.to_state}</span>
            </div>
          `).join('') : '<div class="text-slate-500 italic text-xs">No outgoing transitions (Sink state)</div>'}
        </div>
      </div>
    </div>
  `;
}

function bindNFAEvents(container) {
  const btnSandbox = document.getElementById('btn-build-sandbox-nfa');
  const btnFullLexer = document.getElementById('btn-show-full-lexer-nfa');
  const inputSandbox = document.getElementById('nfa-sandbox-pattern');

  btnSandbox.onclick = async () => {
    const pattern = inputSandbox.value.trim();
    if (!pattern) return;
    btnSandbox.disabled = true;
    try {
      const res = await API.buildSingleNFA(pattern);
      initNFAGraph(res.nfa);
      store.showToast(`Constructed isolated Thompson NFA for '${pattern}'!`, 'success');
    } catch (err) {
      store.showToast(err.message, 'error');
    } finally {
      btnSandbox.disabled = false;
    }
  };

  btnFullLexer.onclick = () => {
    if (store.state.nfa) {
      initNFAGraph(store.state.nfa);
      store.showToast('Displaying full multi-pattern lexer NFA.', 'info');
    }
  };
}
