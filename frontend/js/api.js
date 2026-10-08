/**
 * API Service for communication with the Flask Automata Backend.
 */

const API_BASE = '/api';

export const API = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getRules() {
    const res = await fetch(`${API_BASE}/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  async addRule(rule) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add rule');
    return data;
  },

  async updateRule(ruleId, rule) {
    const res = await fetch(`${API_BASE}/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update rule');
    return data;
  },

  async deleteRule(ruleId) {
    const res = await fetch(`${API_BASE}/rules/${ruleId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete rule');
    return data;
  },

  async resetRules() {
    const res = await fetch(`${API_BASE}/rules/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset rules');
    return res.json();
  },

  async buildAutomata() {
    const res = await fetch(`${API_BASE}/automata/build`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to build automata');
    return res.json();
  },

  async buildSingleNFA(pattern) {
    const res = await fetch(`${API_BASE}/automata/single-nfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to build NFA');
    return data;
  },

  async tokenize(text, useMinimized = true, includeTrace = true) {
    const res = await fetch(`${API_BASE}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, use_minimized: useMinimized, include_trace: includeTrace })
    });
    if (!res.ok) throw new Error('Tokenization failed');
    return res.json();
  },

  async simulate(inputText, useMinimized = true) {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: inputText, use_minimized: useMinimized })
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async getVocabulary() {
    const res = await fetch(`${API_BASE}/vocabulary`);
    if (!res.ok) throw new Error('Failed to fetch vocabulary');
    return res.json();
  },

  async addVocabToken(tokenData) {
    const res = await fetch(`${API_BASE}/vocabulary/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add token');
    return data;
  },

  async updateVocabToken(tokenName, tokenData) {
    const res = await fetch(`${API_BASE}/vocabulary/token/${encodeURIComponent(tokenName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update token');
    return data;
  },

  async deleteVocabToken(tokenName) {
    const res = await fetch(`${API_BASE}/vocabulary/token/${encodeURIComponent(tokenName)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete token');
    return data;
  },

  async resetVocabulary() {
    const res = await fetch(`${API_BASE}/vocabulary/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset vocabulary');
    return res.json();
  },

  async importVocabulary(content, format = 'json') {
    const res = await fetch(`${API_BASE}/vocabulary/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import vocabulary');
    return data;
  },

  async mlPreprocess(tokenIds, options = {}) {
    const res = await fetch(`${API_BASE}/ml/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_ids: tokenIds, ...options })
    });
    if (!res.ok) throw new Error('ML Preprocessing failed');
    return res.json();
  },

  async runTestLab() {
    const res = await fetch(`${API_BASE}/test-lab/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to execute test lab');
    return res.json();
  },

  async runBenchmark(sizes = null) {
    const res = await fetch(`${API_BASE}/benchmark/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sizes })
    });
    if (!res.ok) throw new Error('Failed to execute benchmark');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
