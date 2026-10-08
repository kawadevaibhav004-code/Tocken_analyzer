/**
 * Performance Benchmark Page Module.
 * Executes live benchmarks across 1 KB, 10 KB, 100 KB, 500 KB, and 1 MB payloads.
 * Measures latency, tokens/sec, characters/sec, and MB/s throughput with visual charts.
 */

import { store } from '../store.js';
import { API } from '../api.js';

let benchmarkData = null;

export function renderBenchmark(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Automata Performance Benchmark Suite
          </h1>
          <p class="text-xs text-slate-400 mt-1">Stress-test the deterministic DFA tokenizer across scalable payloads from 1 KB up to 1 MB.</p>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-run-benchmark" class="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
            Execute Benchmark Runs
          </button>
        </div>
      </div>

      <!-- Benchmark Summary KPI Ribbon -->
      <div id="benchmark-kpi-container">
        ${renderKPIs(benchmarkData?.summary)}
      </div>

      <!-- Benchmark Results Table & Visual Bars -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 class="text-base font-bold text-white">Benchmark Measurement Results</h2>

        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Payload Size</th>
                <th class="py-3 px-4">Characters</th>
                <th class="py-3 px-4">Tokens Emitted</th>
                <th class="py-3 px-4">Elapsed Time</th>
                <th class="py-3 px-4">Throughput (Tokens/s)</th>
                <th class="py-3 px-4">Bandwidth (MB/s)</th>
                <th class="py-3 px-4">Relative Speed</th>
              </tr>
            </thead>
            <tbody id="benchmark-tbody" class="divide-y divide-slate-800/80 bg-slate-950/40">
              ${renderBenchmarkRows(benchmarkData?.benchmarks)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Visual Throughput Chart Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tokens per Second Bar Chart -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Tokens Emitted per Second (Higher is Better)
          </h3>
          <div id="benchmark-tokens-chart" class="space-y-2 pt-2">
            ${renderBars(benchmarkData?.benchmarks, 'tokens_per_sec', 'bg-cyan-500', 'tokens/s')}
          </div>
        </div>

        <!-- Bandwidth MB/s Bar Chart -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Text Stream Bandwidth MB/s (Higher is Better)
          </h3>
          <div id="benchmark-bandwidth-chart" class="space-y-2 pt-2">
            ${renderBars(benchmarkData?.benchmarks, 'mb_per_sec', 'bg-emerald-500', 'MB/s')}
          </div>
        </div>
      </div>
    </div>
  `;

  bindBenchmarkEvents(container);

  if (!benchmarkData) {
    executeBenchmark(container);
  }
}

async function executeBenchmark(container) {
  const btn = document.getElementById('btn-run-benchmark');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Benchmarking Payloads...`;
  }

  try {
    const res = await API.runBenchmark();
    benchmarkData = res;
    document.getElementById('benchmark-kpi-container').innerHTML = renderKPIs(res.summary);
    document.getElementById('benchmark-tbody').innerHTML = renderBenchmarkRows(res.benchmarks);
    document.getElementById('benchmark-tokens-chart').innerHTML = renderBars(res.benchmarks, 'tokens_per_sec', 'bg-cyan-500', 'tokens/s');
    document.getElementById('benchmark-bandwidth-chart').innerHTML = renderBars(res.benchmarks, 'mb_per_sec', 'bg-emerald-500', 'MB/s');
    store.showToast(`Completed benchmark across ${res.benchmarks.length} payload tiers!`, 'success');
  } catch (err) {
    store.showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg> Execute Benchmark Runs`;
    }
  }
}

function bindBenchmarkEvents(container) {
  document.getElementById('btn-run-benchmark').onclick = () => executeBenchmark(container);
}

function renderKPIs(summary) {
  if (!summary) return '';
  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass-panel p-4 rounded-xl border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase">Peak Token Throughput</span>
        <div class="text-2xl font-bold text-cyan-400 font-mono mt-1">${summary.max_throughput_tokens_sec.toLocaleString()} <span class="text-xs text-slate-400">tok/s</span></div>
        <span class="text-[11px] text-slate-500">Deterministic O(N) evaluation</span>
      </div>

      <div class="glass-panel p-4 rounded-xl border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase">Peak Processing Bandwidth</span>
        <div class="text-2xl font-bold text-emerald-400 font-mono mt-1">${summary.max_bandwidth_mb_sec} <span class="text-xs text-slate-400">MB/s</span></div>
        <span class="text-[11px] text-slate-500">Continuous character stream</span>
      </div>

      <div class="glass-panel p-4 rounded-xl border border-slate-800">
        <span class="text-xs font-medium text-slate-400 uppercase">Tested Payload Tiers</span>
        <div class="text-2xl font-bold text-white font-mono mt-1">${summary.tested_sizes.join(', ')}</div>
        <span class="text-[11px] text-slate-500">Scales smoothly up to 1 MB</span>
      </div>
    </div>
  `;
}

function renderBenchmarkRows(benchmarks) {
  if (!benchmarks || benchmarks.length === 0) {
    return `<tr><td colspan="7" class="text-center py-8 text-slate-500 italic">No benchmark run executed.</td></tr>`;
  }

  const maxTokSec = Math.max(...benchmarks.map(b => b.tokens_per_sec)) || 1;

  return benchmarks.map(b => {
    const pct = Math.round((b.tokens_per_sec / maxTokSec) * 100);
    return `
      <tr class="hover:bg-slate-900/60 transition-colors">
        <td class="py-2.5 px-4 font-bold text-white">${b.label}</td>
        <td class="py-2.5 px-4 text-slate-300">${b.total_characters.toLocaleString()}</td>
        <td class="py-2.5 px-4 font-semibold text-emerald-300">${b.total_tokens.toLocaleString()}</td>
        <td class="py-2.5 px-4 text-cyan-400 font-bold">${b.elapsed_ms} ms</td>
        <td class="py-2.5 px-4 font-bold text-white">${b.tokens_per_sec.toLocaleString()}</td>
        <td class="py-2.5 px-4 text-slate-300">${b.mb_per_sec} MB/s</td>
        <td class="py-2.5 px-4">
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="bg-cyan-500 h-full rounded-full" style="width: ${pct}%"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderBars(benchmarks, field, colorClass, unit) {
  if (!benchmarks || benchmarks.length === 0) {
    return `<div class="text-xs text-slate-500 italic py-4">No data.</div>`;
  }
  const maxVal = Math.max(...benchmarks.map(b => b[field])) || 1;

  return benchmarks.map(b => {
    const val = b[field];
    const pct = Math.max(8, Math.round((val / maxVal) * 100));
    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-slate-400">${b.label}</span>
          <span class="text-white font-bold">${val.toLocaleString()} ${unit}</span>
        </div>
        <div class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div class="${colorClass} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}
