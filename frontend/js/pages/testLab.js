/**
 * Test Lab Page Module.
 * Automated test suite running 15+ rigorous verification tests against the automata engine.
 * Displays PASS/FAIL badges, expected vs actual outputs, diff inspector, and runtimes.
 */

import { store } from '../store.js';
import { API } from '../api.js';

let testLabResults = null;
let testFilter = 'ALL';

export function renderTestLab(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Automated Automata Test Lab
          </h1>
          <p class="text-xs text-slate-400 mt-1">Formal verification suite testing longest-match, priority conflicts, unicode resilience, and edge cases.</p>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-run-all-tests" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
            Run All Automated Tests
          </button>
        </div>
      </div>

      <!-- Test Metrics Ribbon -->
      <div id="test-metrics-container">
        ${renderTestMetrics(testLabResults)}
      </div>

      <!-- Test Cases List -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-white">Test Cases Registry</h2>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400">Filter:</span>
            <select id="test-filter-select" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200">
              <option value="ALL">All Test Cases</option>
              <option value="PASS">Passed Tests Only</option>
              <option value="FAIL">Failed Tests Only</option>
            </select>
          </div>
        </div>

        <div id="test-cards-list" class="space-y-3">
          ${renderTestCards(testLabResults?.test_results, 'ALL')}
        </div>
      </div>
    </div>
  `;

  bindTestLabEvents(container);
  // Auto-run on first mount if not yet run
  if (!testLabResults) {
    executeTestLab(container);
  }
}

async function executeTestLab(container) {
  const btn = document.getElementById('btn-run-all-tests');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Running Verification...`;
  }

  try {
    const res = await API.runTestLab();
    testLabResults = res;
    document.getElementById('test-metrics-container').innerHTML = renderTestMetrics(res);
    document.getElementById('test-cards-list').innerHTML = renderTestCards(res.test_results, testFilter);
    store.showToast(`Test Lab: ${res.passed}/${res.total_tests} passed (${res.pass_rate_pct}%) in ${res.total_execution_time_ms} ms!`, res.failed === 0 ? 'success' : 'info');
  } catch (err) {
    store.showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg> Run All Automated Tests`;
    }
  }
}

function bindTestLabEvents(container) {
  const btnRun = document.getElementById('btn-run-all-tests');
  const selFilter = document.getElementById('test-filter-select');

  btnRun.onclick = () => executeTestLab(container);

  selFilter.onchange = (e) => {
    testFilter = e.target.value;
    if (testLabResults) {
      document.getElementById('test-cards-list').innerHTML = renderTestCards(testLabResults.test_results, testFilter);
    }
  };
}

function renderTestMetrics(res) {
  if (!res) {
    return `
      <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
        Click 'Run All Automated Tests' to inspect formal test suite.
      </div>
    `;
  }

  const allPassed = res.failed === 0;

  return `
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
        <span class="text-[11px] font-medium text-slate-400 uppercase">Total Tests</span>
        <div class="text-2xl font-bold text-white font-mono mt-0.5">${res.total_tests}</div>
      </div>
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
        <span class="text-[11px] font-medium text-slate-400 uppercase">Passed</span>
        <div class="text-2xl font-bold text-emerald-400 font-mono mt-0.5">${res.passed}</div>
      </div>
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
        <span class="text-[11px] font-medium text-slate-400 uppercase">Failed</span>
        <div class="text-2xl font-bold ${res.failed > 0 ? 'text-rose-400' : 'text-slate-400'} font-mono mt-0.5">${res.failed}</div>
      </div>
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
        <span class="text-[11px] font-medium text-slate-400 uppercase">Pass Rate</span>
        <div class="text-2xl font-bold ${allPassed ? 'text-emerald-400' : 'text-amber-400'} font-mono mt-0.5">${res.pass_rate_pct}%</div>
      </div>
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
        <span class="text-[11px] font-medium text-slate-400 uppercase">Execution Time</span>
        <div class="text-2xl font-bold text-cyan-400 font-mono mt-0.5">${res.total_execution_time_ms} <span class="text-xs text-slate-400 font-sans font-normal">ms</span></div>
      </div>
    </div>
  `;
}

function renderTestCards(tests, filter) {
  if (!tests || tests.length === 0) {
    return `<div class="p-4 text-xs text-slate-500 italic">No tests to display.</div>`;
  }

  const filtered = tests.filter(t => filter === 'ALL' || t.status === filter);

  return filtered.map(t => {
    const isPass = t.status === 'PASS';
    return `
      <div class="p-4 rounded-xl border ${isPass ? 'bg-slate-950/60 border-slate-800/90' : 'bg-rose-950/30 border-rose-800'} space-y-2.5 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${isPass ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}">
              ${t.status}
            </span>
            <span class="text-xs font-mono text-slate-400">${t.id}</span>
            <strong class="text-sm font-semibold text-white">${escapeHtml(t.name)}</strong>
          </div>
          <span class="text-[11px] font-mono text-cyan-400">${t.execution_time_ms} ms</span>
        </div>

        <p class="text-xs text-slate-400 font-sans">${escapeHtml(t.description)}</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono pt-1">
          <div class="p-2 rounded bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-500 font-sans uppercase block">Input Stream:</span>
            <span class="text-cyan-300 font-bold truncate block">"${escapeHtml(t.input)}"</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-500 font-sans uppercase block">Expected:</span>
            <span class="text-emerald-400 truncate block">${JSON.stringify(t.expected.lexemes)}</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-500 font-sans uppercase block">Actual:</span>
            <span class="${isPass ? 'text-slate-300' : 'text-rose-400'} truncate block">${JSON.stringify(t.actual.lexemes)}</span>
          </div>
        </div>

        ${!isPass ? `
          <div class="p-2 rounded bg-rose-900/30 border border-rose-800 text-rose-300 text-xs font-mono">
            <strong>Diff / Error:</strong> ${escapeHtml(t.difference)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
