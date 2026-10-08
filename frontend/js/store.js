/**
 * Central Reactive State Store for Automata Tokenizer.
 */

class Store {
  constructor() {
    this.state = {
      activeView: 'dashboard',
      theme: localStorage.getItem('theme') || 'dark',
      rules: [],
      nfa: null,
      dfa: null,
      minimizedDfa: null,
      pipelineStats: null,
      lastTokenization: null,
      vocabulary: null,
      settings: null,
      activeSimState: null,
      toasts: [],
      loading: false
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    }
  }

  setView(viewName) {
    this.state.activeView = viewName;
    window.location.hash = viewName;
    this.notify();
  }

  setTheme(theme) {
    this.state.theme = theme;
    localStorage.setItem('theme', theme);
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
    this.notify();
  }

  toggleTheme() {
    this.setTheme(this.state.theme === 'dark' ? 'light' : 'dark');
  }

  setLoading(val) {
    this.state.loading = val;
    this.notify();
  }

  setAutomataData({ nfa, dfa, minimizedDfa, stats }) {
    this.state.nfa = nfa;
    this.state.dfa = dfa;
    this.state.minimizedDfa = minimizedDfa;
    this.state.pipelineStats = stats;
    this.notify();
  }

  setRules(rules) {
    this.state.rules = rules;
    this.notify();
  }

  setTokenizationResult(res) {
    this.state.lastTokenization = res;
    this.notify();
  }

  setVocabulary(vocab) {
    this.state.vocabulary = vocab;
    this.notify();
  }

  showToast(message, type = 'info', duration = 3500) {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    this.state.toasts.push(toast);
    this.notify();
    setTimeout(() => {
      this.state.toasts = this.state.toasts.filter(t => t.id !== id);
      this.notify();
    }, duration);
  }
}

export const store = new Store();
