/**
 * Main Application Controller & Router (Simplified for Demonstration).
 * Manages only the 5 core sections:
 *  1. Dashboard
 *  2. Regex Rules
 *  3. Automata (Consolidated NFA, DFA, and Minimized DFA)
 *  4. Tokenizer
 *  5. ML Output
 */

import { store } from './store.js';
import { API } from './api.js';

// Clean 5 Core Page Modules
import { renderDashboard } from './pages/dashboard.js';
import { renderRules } from './pages/rules.js';
import { renderAutomata } from './pages/automata.js';
import { renderTokenizer } from './pages/tokenizer.js';
import { renderMLExport } from './pages/mlExport.js';

const ROUTES = {
  dashboard: renderDashboard,
  rules: renderRules,
  automata: renderAutomata,
  tokenizer: renderTokenizer,
  'ml-export': renderMLExport
};

async function initApp() {
  console.log('Initializing Clean Automata-Based Tokenizer App...');

  // Theme setup
  store.setTheme('dark');

  // Hash change routing
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (ROUTES[hash]) {
      store.setView(hash);
    }
  });

  // Sidebar navigation clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      if (view && ROUTES[view]) {
        store.setView(view);
      }
    });
  });

  // Topbar quick button
  const topbarBtn = document.getElementById('topbar-quick-tokenize');
  if (topbarBtn) {
    topbarBtn.onclick = () => store.setView('tokenizer');
  }

  // Mobile menu toggle
  const mobileBtn = document.getElementById('btn-mobile-menu');
  const sidebar = document.getElementById('app-sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.onclick = () => {
      sidebar.classList.toggle('hidden');
    };
  }

  // Subscribe view renderer to store changes
  store.subscribe((state) => {
    updateNavSelection(state.activeView);
    updateTopbar(state);
    renderActiveView(state.activeView);
    renderToasts(state.toasts);
  });

  // Initial Data Fetching from Flask Backend
  try {
    const rulesRes = await API.getRules();
    store.setRules(rulesRes.rules);

    const automataRes = await API.buildAutomata();
    store.setAutomataData({
      nfa: automataRes.nfa,
      dfa: automataRes.dfa,
      minimizedDfa: automataRes.minimized_dfa,
      stats: automataRes.stats
    });

    const settingsRes = await API.getSettings();
    store.state.settings = settingsRes;

    // Run initial demo tokenization
    const sampleText = "if count == 100 return 42";
    const tokRes = await API.tokenize(sampleText, true, false);
    store.setTokenizationResult(tokRes);

    setBackendStatus(true);
  } catch (err) {
    console.error('Backend connection warning:', err);
    setBackendStatus(false);
  }

  // Initial Route Load
  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  store.setView(ROUTES[initialHash] ? initialHash : 'dashboard');
}

function renderActiveView(viewName) {
  const contentEl = document.getElementById('main-content');
  const renderer = ROUTES[viewName] || renderDashboard;
  if (contentEl) {
    renderer(contentEl);
  }
}

function updateNavSelection(activeView) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const view = item.getAttribute('data-view');
    if (view === activeView) {
      item.className = 'nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md transition';
    } else {
      item.className = 'nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition font-medium';
    }
  });

  const titleEl = document.getElementById('topbar-view-title');
  if (titleEl) {
    const names = {
      dashboard: 'Dashboard',
      rules: 'Regex Rules',
      automata: 'Automata (NFA → DFA → Min)',
      tokenizer: 'Tokenizer',
      'ml-export': 'ML Output'
    };
    titleEl.textContent = names[activeView] || 'Automata Tokenizer';
  }
}

function updateTopbar(state) {
  const ribbonEl = document.getElementById('topbar-pipeline-ribbon');
  const stats = state.pipelineStats;
  if (!ribbonEl || !stats) return;

  ribbonEl.innerHTML = `
    <span class="text-blue-400 font-semibold">NFA: ${stats.nfa_states ?? 0}</span>
    <span class="text-slate-600">→</span>
    <span class="text-cyan-400 font-semibold">DFA: ${stats.dfa_states ?? 0}</span>
    <span class="text-slate-600">→</span>
    <span class="text-emerald-400 font-semibold">Min: ${stats.minimized_dfa_states ?? 0}</span>
  `;
}

function setBackendStatus(isOnline) {
  const ind = document.getElementById('backend-status-indicator');
  const text = document.getElementById('backend-status-text');
  if (ind && text) {
    if (isOnline) {
      ind.className = 'w-2 h-2 rounded-full bg-emerald-500';
      text.textContent = 'API Ready';
      text.className = 'font-mono text-emerald-400';
    } else {
      ind.className = 'w-2 h-2 rounded-full bg-rose-500';
      text.textContent = 'Connecting';
      text.className = 'font-mono text-rose-400';
    }
  }
}

function renderToasts(toasts) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  container.innerHTML = toasts.map(t => {
    const isError = t.type === 'error';
    const isSuccess = t.type === 'success';
    const bg = isError ? 'bg-rose-950 border-rose-700 text-rose-200' :
               isSuccess ? 'bg-emerald-950 border-emerald-700 text-emerald-200' :
               'bg-slate-900 border-slate-700 text-slate-200';
    const icon = isError ? '⚠️' : isSuccess ? '✅' : '⚡';

    return `
      <div class="glass-panel px-4 py-2 rounded-xl border ${bg} shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-auto transition">
        <span>${icon}</span>
        <span>${t.message}</span>
      </div>
    `;
  }).join('');
}

// Start app once DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
