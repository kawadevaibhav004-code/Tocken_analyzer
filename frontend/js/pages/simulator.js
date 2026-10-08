/**
 * DFA Simulator Page Module.
 * Interactive animated step-by-step playback with visual node & transition highlighting.
 * Controls: Play, Pause, Next Step, Prev Step, Restart, Speed Control.
 */

import { store } from '../store.js';
import { API } from '../api.js';
import { AutomataGraph } from '../components/graph.js';

let simGraphInstance = null;
let simulationResult = null;
let currentStepIdx = 0;
let isPlaying = false;
let playInterval = null;
let playbackSpeedMs = 700;

export function renderSimulator(container) {
  const minDfa = store.state.minimizedDfa || store.state.dfa;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Interactive DFA Step Simulator
          </h1>
          <p class="text-xs text-slate-400 mt-1">Trace input characters through the DFA step-by-step with state highlighting and transition playback.</p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            State: <span id="sim-status-badge" class="text-amber-400 font-bold">Idle</span>
          </span>
        </div>
      </div>

      <!-- Simulation Input & Playback Control Ribbon -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex flex-col md:flex-row items-center gap-3">
          <input type="text" id="sim-input-text" value="123.45" placeholder="Enter string to simulate..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-amber-500 w-full">
          <button id="btn-start-sim" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-xl shadow-lg transition flex items-center gap-2 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Simulate String
          </button>
        </div>

        <!-- Player Controls Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div class="flex items-center gap-1.5">
            <button id="btn-sim-restart" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Restart">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <button id="btn-sim-prev" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Previous Step">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button id="btn-sim-play" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
              Play
            </button>
            <button id="btn-sim-next" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="Next Step">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Progress Ribbon -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">Step:</span>
            <span id="sim-step-indicator" class="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">0 / 0</span>
          </div>

          <!-- Speed slider -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">Speed:</span>
            <input type="range" id="sim-speed-slider" min="200" max="1500" step="100" value="700" class="w-24 accent-amber-500 cursor-pointer">
            <span id="sim-speed-label" class="text-xs text-slate-300 font-mono w-14">700ms</span>
          </div>
        </div>
      </div>

      <!-- Current Step Spotlight -->
      <div id="sim-current-spotlight" class="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">▶</div>
          <div>
            <div id="sim-spotlight-desc" class="text-sm font-bold text-white font-mono">Press 'Simulate String' to begin execution</div>
            <div id="sim-spotlight-sub" class="text-xs text-slate-400 mt-0.5">Machine starts at DFA start state q0</div>
          </div>
        </div>
        <div id="sim-spotlight-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
          Ready
        </div>
      </div>

      <!-- Graph Canvas + Step History Table -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Live Highlighting Graph -->
        <div class="lg:col-span-7 glass-panel p-4 rounded-2xl border border-slate-800">
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs font-bold text-slate-300">Live DFA Execution Graph</span>
            <span class="text-[11px] text-amber-400 font-mono animate-pulse">● Glowing = Current State</span>
          </div>
          <div id="sim-graph-canvas" class="w-full h-[480px]"></div>
        </div>

        <!-- Steps Timeline Table -->
        <div class="lg:col-span-5 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <h2 class="text-sm font-bold text-white mb-2">Execution Log</h2>
          <div class="overflow-y-auto max-h-[440px] rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">Step</th>
                  <th class="py-2.5 px-3">Char</th>
                  <th class="py-2.5 px-3">Transition</th>
                  <th class="py-2.5 px-3">Accepting?</th>
                </tr>
              </thead>
              <tbody id="sim-steps-tbody" class="divide-y divide-slate-800/80 bg-slate-950/60">
                <tr>
                  <td colspan="4" class="text-center py-8 text-slate-500 italic font-sans">
                    No simulation executed yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  initSimulatorGraph(minDfa);
  bindSimulatorEvents(container);
}

function initSimulatorGraph(dfaData) {
  if (!dfaData) return;
  simGraphInstance = new AutomataGraph('sim-graph-canvas', {
    isNFA: false
  });
  simGraphInstance.setData(dfaData, false);
}

function bindSimulatorEvents(container) {
  const inputEl = document.getElementById('sim-input-text');
  const btnStart = document.getElementById('btn-start-sim');
  const btnPlay = document.getElementById('btn-sim-play');
  const btnPrev = document.getElementById('btn-sim-prev');
  const btnNext = document.getElementById('btn-sim-next');
  const btnRestart = document.getElementById('btn-sim-restart');
  const sliderSpeed = document.getElementById('sim-speed-slider');
  const speedLabel = document.getElementById('sim-speed-label');

  sliderSpeed.oninput = (e) => {
    playbackSpeedMs = Number(e.target.value);
    speedLabel.textContent = `${playbackSpeedMs}ms`;
    if (isPlaying) {
      pauseSimulation();
      playSimulation();
    }
  };

  btnStart.onclick = async () => {
    const text = inputEl.value;
    btnStart.disabled = true;
    try {
      simulationResult = await API.simulate(text, true);
      currentStepIdx = 0;
      updateStepUI();
      renderStepsTable();
      store.showToast(`Simulated '${text}' across ${simulationResult.frames.length} steps!`, 'success');
    } catch (err) {
      store.showToast(err.message, 'error');
    } finally {
      btnStart.disabled = false;
    }
  };

  const playSimulation = () => {
    if (!simulationResult || !simulationResult.frames.length) return;
    isPlaying = true;
    btnPlay.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Pause`;
    btnPlay.classList.replace('bg-blue-600', 'bg-amber-600');

    playInterval = setInterval(() => {
      if (currentStepIdx < simulationResult.frames.length - 1) {
        currentStepIdx++;
        updateStepUI();
      } else {
        pauseSimulation();
      }
    }, playbackSpeedMs);
  };

  const pauseSimulation = () => {
    isPlaying = false;
    clearInterval(playInterval);
    playInterval = null;
    btnPlay.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg> Play`;
    btnPlay.classList.replace('bg-amber-600', 'bg-blue-600');
  };

  btnPlay.onclick = () => {
    if (isPlaying) {
      pauseSimulation();
    } else {
      if (simulationResult && currentStepIdx >= simulationResult.frames.length - 1) {
        currentStepIdx = 0;
      }
      playSimulation();
    }
  };

  btnNext.onclick = () => {
    pauseSimulation();
    if (simulationResult && currentStepIdx < simulationResult.frames.length - 1) {
      currentStepIdx++;
      updateStepUI();
    }
  };

  btnPrev.onclick = () => {
    pauseSimulation();
    if (simulationResult && currentStepIdx > 0) {
      currentStepIdx--;
      updateStepUI();
    }
  };

  btnRestart.onclick = () => {
    pauseSimulation();
    currentStepIdx = 0;
    updateStepUI();
  };
}

function updateStepUI() {
  if (!simulationResult || !simulationResult.frames.length) return;
  const frame = simulationResult.frames[currentStepIdx];
  const total = simulationResult.frames.length;

  // Step indicator
  const stepInd = document.getElementById('sim-step-indicator');
  if (stepInd) stepInd.textContent = `${currentStepIdx + 1} / ${total}`;

  // Active state highlighting on graph
  if (simGraphInstance && frame.to_state >= 0) {
    simGraphInstance.setActiveState(frame.to_state);
  }

  // Spotlight description
  const descEl = document.getElementById('sim-spotlight-desc');
  const subEl = document.getElementById('sim-spotlight-sub');
  const badgeEl = document.getElementById('sim-spotlight-badge');
  const statusBadge = document.getElementById('sim-status-badge');

  if (descEl) descEl.textContent = frame.description;
  if (subEl) {
    if (frame.has_transition) {
      subEl.textContent = `Input: '${frame.char}' | From State: q${frame.from_state} → To State: q${frame.to_state}`;
    } else {
      subEl.textContent = `No transition on '${frame.char}' (Dead/Trap)`;
    }
  }

  if (badgeEl) {
    if (frame.is_accepting) {
      badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700';
      badgeEl.textContent = `ACCEPTING (${frame.token_name})`;
    } else if (!frame.has_transition) {
      badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700';
      badgeEl.textContent = 'TRAPPED / HALTED';
    } else {
      badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800';
      badgeEl.textContent = 'INTERMEDIATE';
    }
  }

  if (statusBadge) {
    statusBadge.textContent = `Step ${currentStepIdx + 1}`;
  }

  // Highlight step in table
  document.querySelectorAll('.sim-step-row').forEach((row, idx) => {
    if (idx === currentStepIdx) {
      row.className = 'sim-step-row bg-amber-500/20 font-bold text-white transition-colors';
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      row.className = 'sim-step-row hover:bg-slate-900/50 text-slate-300 transition-colors';
    }
  });
}

function renderStepsTable() {
  const tbody = document.getElementById('sim-steps-tbody');
  if (!tbody || !simulationResult) return;

  tbody.innerHTML = simulationResult.frames.map((f, idx) => `
    <tr class="sim-step-row ${idx === currentStepIdx ? 'bg-amber-500/20 text-white font-bold' : 'hover:bg-slate-900/50 text-slate-300'} transition-colors cursor-pointer" onclick="jumpToStep(${idx})">
      <td class="py-2 px-3 text-slate-400">${f.step}</td>
      <td class="py-2 px-3 text-cyan-300 font-bold">${f.char || '—'}</td>
      <td class="py-2 px-3">
        ${f.has_transition ? `q${f.from_state} → q${f.to_state}` : '<span class="text-rose-400">Dead</span>'}
      </td>
      <td class="py-2 px-3">
        ${f.is_accepting ? `<span class="text-emerald-400 font-semibold">${f.token_name}</span>` : '<span class="text-slate-500">No</span>'}
      </td>
    </tr>
  `).join('');
}

window.jumpToStep = (idx) => {
  currentStepIdx = idx;
  updateStepUI();
};
