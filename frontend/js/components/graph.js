/**
 * Interactive SVG Automata Graph Visualizer.
 * Supports NFA, DFA, and Minimized DFA.
 * Features:
 *   - Start arrow indicator
 *   - Concentric double-circle accepting states
 *   - Token labels and candidate badges
 *   - Curved directed edges and self-loops
 *   - Epsilon transition styling (dashed)
 *   - Interactive Pan & Zoom & Dragging
 *   - Node click inspection
 *   - Active state glowing highlight (for DFA Simulator)
 */

export class AutomataGraph {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Graph container #${containerId} not found`);
    }

    this.options = {
      isNFA: options.isNFA || false,
      activeState: options.activeState ?? null,
      onNodeClick: options.onNodeClick || null,
      ...options
    };

    this.nodes = [];
    this.edges = [];
    this.nodePositions = new Map(); // id -> {x, y}
    this.transform = { x: 50, y: 50, scale: 1.0 };
    this.isDraggingCanvas = false;
    this.dragStart = { x: 0, y: 0 };
    this.draggedNode = null;
    this.selectedNodeId = null;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
        <!-- Floating Canvas Controls -->
        <div class="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-800/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-lg text-xs">
          <button id="${this.container.id}-btn-zoom-in" class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white" title="Zoom In">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </button>
          <button id="${this.container.id}-btn-zoom-out" class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white" title="Zoom Out">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"/></svg>
          </button>
          <button id="${this.container.id}-btn-reset" class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white" title="Reset View">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
          <div class="h-4 w-px bg-slate-700 mx-1"></div>
          <span id="${this.container.id}-zoom-level" class="text-slate-400 font-mono text-[11px] w-12 text-center">100%</span>
        </div>

        <!-- Legend -->
        <div class="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 pointer-events-none">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-950/60"></div>
            <span>Standard State</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 p-[1px] flex items-center justify-center">
              <div class="w-2 h-2 rounded-full border border-emerald-400 bg-emerald-950/60"></div>
            </div>
            <span>Accepting (Token)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
            <span>Active Step</span>
          </div>
          ${this.options.isNFA ? `
          <div class="flex items-center gap-1.5">
            <div class="w-4 h-0.5 border-b border-dashed border-purple-400"></div>
            <span>ε-transition</span>
          </div>` : ''}
        </div>

        <!-- SVG Element -->
        <svg id="${this.container.id}-svg" class="w-full h-full graph-svg" width="100%" height="100%">
          <defs>
            <marker id="arrow-${this.container.id}" viewBox="0 -5 10 10" refX="28" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#64748b" />
            </marker>
            <marker id="arrow-eps-${this.container.id}" viewBox="0 -5 10 10" refX="28" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#c084fc" />
            </marker>
            <marker id="arrow-active-${this.container.id}" viewBox="0 -5 10 10" refX="28" refY="0" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#f59e0b" />
            </marker>
            <marker id="start-arrow-${this.container.id}" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#3b82f6" />
            </marker>
          </defs>
          <g id="${this.container.id}-viewport" transform="translate(50, 50) scale(1)">
            <g id="${this.container.id}-edges-group"></g>
            <g id="${this.container.id}-nodes-group"></g>
          </g>
        </svg>
      </div>
    `;

    this.svg = document.getElementById(`${this.container.id}-svg`);
    this.viewport = document.getElementById(`${this.container.id}-viewport`);
    this.edgesGroup = document.getElementById(`${this.container.id}-edges-group`);
    this.nodesGroup = document.getElementById(`${this.container.id}-nodes-group`);
    this.zoomLabel = document.getElementById(`${this.container.id}-zoom-level`);
  }

  bindEvents() {
    // Zoom in/out/reset buttons
    document.getElementById(`${this.container.id}-btn-zoom-in`).onclick = () => this.zoom(1.2);
    document.getElementById(`${this.container.id}-btn-zoom-out`).onclick = () => this.zoom(0.8);
    document.getElementById(`${this.container.id}-btn-reset`).onclick = () => this.resetView();

    // Mouse wheel zoom
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.zoom(zoomFactor, e.clientX, e.clientY);
    });

    // Canvas panning
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('.graph-node')) return; // ignore if clicking on a node
      this.isDraggingCanvas = true;
      this.dragStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingCanvas) {
        this.transform.x = e.clientX - this.dragStart.x;
        this.transform.y = e.clientY - this.dragStart.y;
        this.updateTransform();
      } else if (this.draggedNode) {
        // Move node
        const pt = this.svgPoint(e.clientX, e.clientY);
        this.nodePositions.set(this.draggedNode, { x: pt.x, y: pt.y });
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingCanvas = false;
      this.draggedNode = null;
    });
  }

  svgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.viewport.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: clientX, y: clientY };
  }

  zoom(factor, clientX = null, clientY = null) {
    const newScale = Math.min(3.0, Math.max(0.2, this.transform.scale * factor));
    if (clientX !== null && clientY !== null) {
      const pt = this.svgPoint(clientX, clientY);
      this.transform.x -= pt.x * (newScale - this.transform.scale);
      this.transform.y -= pt.y * (newScale - this.transform.scale);
    }
    this.transform.scale = newScale;
    this.updateTransform();
  }

  resetView() {
    this.transform = { x: 50, y: 50, scale: 1.0 };
    this.updateTransform();
  }

  updateTransform() {
    this.viewport.setAttribute('transform', `translate(${this.transform.x}, ${this.transform.y}) scale(${this.transform.scale})`);
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
  }

  setData(data, isNFA = false) {
    this.options.isNFA = isNFA;
    if (!data) return;

    if (isNFA) {
      this.nodes = (data.states || []).map(s => {
        const acceptInfo = (data.accept_states || []).find(a => a.state === s);
        return {
          id: s,
          label: `s${s}`,
          isStart: s === data.start_state,
          isAccept: !!acceptInfo,
          tokenName: acceptInfo?.token_name || null,
          tokenId: acceptInfo?.token_id || null,
          priority: acceptInfo?.priority || null,
          raw: acceptInfo
        };
      });

      this.edges = (data.transitions || []).map(t => ({
        from: t.from_state,
        to: t.to_state,
        label: t.display_label,
        isEpsilon: t.is_epsilon
      }));
    } else {
      // DFA or Minimized DFA
      this.nodes = (data.states || []).map(s => ({
        id: s.id,
        label: `q${s.id}`,
        isStart: s.is_start || s.id === data.start_state_id,
        isAccept: s.is_accept,
        tokenName: s.token_name || null,
        tokenId: s.token_id || null,
        priority: s.priority || null,
        nfaStates: s.nfa_states || [],
        candidates: s.candidate_tokens || [],
        raw: s
      }));

      this.edges = (data.transitions || []).map(t => ({
        from: t.from_state,
        to: t.to_state,
        label: t.display_label,
        isEpsilon: false
      }));
    }

    this.computeLayout();
    this.render();
  }

  setActiveState(stateId) {
    this.options.activeState = stateId;
    this.render();
  }

  computeLayout() {
    this.nodePositions.clear();
    const count = this.nodes.length;
    if (count === 0) return;

    // Use a grid/layered layout organized by depth or rank from start state
    const startNode = this.nodes.find(n => n.isStart) || this.nodes[0];
    const visited = new Set();
    const levels = new Map(); // level -> array of node ids
    const nodeLevel = new Map();

    const queue = [{ id: startNode.id, level: 0 }];
    visited.add(startNode.id);

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      nodeLevel.set(id, level);
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level).push(id);

      // Find children
      const children = this.edges
        .filter(e => e.from === id && !visited.has(e.to))
        .map(e => e.to);

      for (const childId of children) {
        visited.add(childId);
        queue.push({ id: childId, level: level + 1 });
      }
    }

    // Any remaining unvisited nodes
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        const fallbackLevel = Math.max(0, ...Array.from(levels.keys())) + 1;
        if (!levels.has(fallbackLevel)) levels.set(fallbackLevel, []);
        levels.get(fallbackLevel).push(node.id);
      }
    }

    const colWidth = 140;
    const rowHeight = 110;

    levels.forEach((nodeIds, level) => {
      const totalH = (nodeIds.length - 1) * rowHeight;
      const startY = 160 - totalH / 2;

      nodeIds.forEach((id, idx) => {
        const x = 120 + level * colWidth;
        const y = startY + idx * rowHeight;
        this.nodePositions.set(id, { x, y });
      });
    });
  }

  render() {
    this.renderEdges();
    this.renderNodes();
  }

  renderEdges() {
    this.edgesGroup.innerHTML = '';
    const grouped = new Map(); // "from-to" -> list of edges

    this.edges.forEach(e => {
      const key = `${e.from}->${e.to}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(e);
    });

    grouped.forEach((edgeList, key) => {
      const [fromId, toId] = key.split('->').map(Number);
      const fromPos = this.nodePositions.get(fromId);
      const toPos = this.nodePositions.get(toId);
      if (!fromPos || !toPos) return;

      const labels = edgeList.map(e => e.label).join(', ');
      const isEps = edgeList.some(e => e.isEpsilon);
      const isSelf = fromId === toId;

      let pathD = '';
      let labelX = 0;
      let labelY = 0;

      if (isSelf) {
        // Self loop arc above node
        pathD = `M ${fromPos.x - 12} ${fromPos.y - 20} C ${fromPos.x - 35} ${fromPos.y - 65}, ${fromPos.x + 35} ${fromPos.y - 65}, ${fromPos.x + 12} ${fromPos.y - 20}`;
        labelX = fromPos.x;
        labelY = fromPos.y - 65;
      } else {
        // Check if there is a reverse edge
        const revKey = `${toId}->${fromId}`;
        const hasReverse = grouped.has(revKey);

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (hasReverse) {
          // Curved arc to prevent collision with reverse edge
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const normalX = -dy / dist;
          const normalY = dx / dist;
          const curveOffset = 30;

          const ctrlX = midX + normalX * curveOffset;
          const ctrlY = midY + normalY * curveOffset;

          pathD = `M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`;
          labelX = ctrlX;
          labelY = ctrlY;
        } else {
          // Straight line
          pathD = `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
          labelX = (fromPos.x + toPos.x) / 2;
          labelY = (fromPos.y + toPos.y) / 2 - 8;
        }
      }

      // Create SVG Path
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', isEps ? '#c084fc' : '#64748b');
      pathEl.setAttribute('stroke-width', '1.75');
      if (isEps) {
        pathEl.setAttribute('stroke-dasharray', '4,3');
        pathEl.setAttribute('marker-end', `url(#arrow-eps-${this.container.id})`);
      } else {
        pathEl.setAttribute('marker-end', `url(#arrow-${this.container.id})`);
      }
      this.edgesGroup.appendChild(pathEl);

      // Edge Label Pill
      const gLabel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gLabel.setAttribute('transform', `translate(${labelX}, ${labelY})`);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.textContent = labels;
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'middle');
      textEl.setAttribute('class', `text-[10px] font-mono font-medium ${isEps ? 'fill-purple-300' : 'fill-slate-300'}`);

      // Background rect for text readability
      const labelLen = labels.length;
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', `${-labelLen * 3.5 - 6}`);
      rectEl.setAttribute('y', '-9');
      rectEl.setAttribute('width', `${labelLen * 7 + 12}`);
      rectEl.setAttribute('height', '18');
      rectEl.setAttribute('rx', '4');
      rectEl.setAttribute('fill', isEps ? '#3b0764' : '#0f172a');
      rectEl.setAttribute('stroke', isEps ? '#a855f7' : '#334155');
      rectEl.setAttribute('stroke-width', '1');

      gLabel.appendChild(rectEl);
      gLabel.appendChild(textEl);
      this.edgesGroup.appendChild(gLabel);
    });
  }

  renderNodes() {
    this.nodesGroup.innerHTML = '';

    this.nodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;

      const isActive = this.options.activeState === node.id;
      const isSelected = this.selectedNodeId === node.id;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      g.setAttribute('class', 'graph-node cursor-pointer');

      // Drag listener for individual node
      g.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.draggedNode = node.id;
        this.selectedNodeId = node.id;
        this.render();
        if (this.options.onNodeClick) {
          this.options.onNodeClick(node);
        }
      });

      // Start arrow
      if (node.isStart) {
        const startArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        startArrow.setAttribute('d', `M -45 0 L -28 0`);
        startArrow.setAttribute('stroke', '#3b82f6');
        startArrow.setAttribute('stroke-width', '2.5');
        startArrow.setAttribute('marker-end', `url(#start-arrow-${this.container.id})`);
        g.appendChild(startArrow);

        const startText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        startText.textContent = 'START';
        startText.setAttribute('x', '-56');
        startText.setAttribute('y', '3');
        startText.setAttribute('text-anchor', 'end');
        startText.setAttribute('class', 'text-[9px] font-bold fill-blue-400');
        g.appendChild(startText);
      }

      // Outer Circle
      const circleOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleOuter.setAttribute('r', '24');

      let strokeColor = '#3b82f6';
      let fillColor = '#1e293b';

      if (node.isAccept) {
        strokeColor = '#10b981';
        fillColor = '#064e3b';
      }

      if (isActive) {
        strokeColor = '#f59e0b';
        fillColor = '#78350f';
        g.setAttribute('class', 'graph-node cursor-pointer node-active');
      } else if (isSelected) {
        strokeColor = '#60a5fa';
        circleOuter.setAttribute('stroke-width', '3');
      }

      circleOuter.setAttribute('stroke', strokeColor);
      circleOuter.setAttribute('stroke-width', isSelected || isActive ? '3' : '2');
      circleOuter.setAttribute('fill', fillColor);
      g.appendChild(circleOuter);

      // Concentric Inner Circle for Accepting States
      if (node.isAccept) {
        const circleInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleInner.setAttribute('r', '19');
        circleInner.setAttribute('stroke', strokeColor);
        circleInner.setAttribute('stroke-width', '1.5');
        circleInner.setAttribute('fill', 'none');
        g.appendChild(circleInner);
      }

      // State Label (e.g. q0 or s0)
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.textContent = node.label;
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dominant-baseline', 'middle');
      labelText.setAttribute('class', `text-xs font-mono font-bold ${isActive ? 'fill-amber-200' : 'fill-white'}`);
      g.appendChild(labelText);

      // Token label pill below node
      if (node.isAccept && node.tokenName) {
        const gToken = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gToken.setAttribute('transform', 'translate(0, 36)');

        const tText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tText.textContent = node.tokenName;
        tText.setAttribute('text-anchor', 'middle');
        tText.setAttribute('dominant-baseline', 'middle');
        tText.setAttribute('class', 'text-[10px] font-semibold fill-emerald-200');

        const tLen = node.tokenName.length;
        const tRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tRect.setAttribute('x', `${-tLen * 3.2 - 5}`);
        tRect.setAttribute('y', '-8');
        tRect.setAttribute('width', `${tLen * 6.4 + 10}`);
        tRect.setAttribute('height', '16');
        tRect.setAttribute('rx', '4');
        tRect.setAttribute('fill', '#064e3b');
        tRect.setAttribute('stroke', '#10b981');
        tRect.setAttribute('stroke-width', '1');

        gToken.appendChild(tRect);
        gToken.appendChild(tText);
        g.appendChild(gToken);
      }

      this.nodesGroup.appendChild(g);
    });
  }
}
