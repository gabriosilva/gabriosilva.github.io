import {
  GRAPH,
  HOLD_DEFAULT,
  HOLD_MAX,
  HOLD_MIN,
  schedule,
  type Graph,
  type Wave,
} from './pulse-model';
import { PulseSim, type SimEvent, type SimPulse } from './pulse-sim';
import { pluck, setSoundEnabled, soundEnabled, thud } from './sound';

const SVG = 'http://www.w3.org/2000/svg';
const REST_BETWEEN_LOOPS = 900;
const PAD = 30;

/** `bare`: only the points and paths, no score or controls. */
type Options = { hold?: number; bare?: boolean };

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.appendChild(node);
  return node;
}

function html<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text) node.textContent = text;
  return node;
}

/** Mounts the pulse network into `root`. Returns a cleanup function. */
export function mountPulseNetwork(root: HTMLElement, options: Options = {}) {
  const home = GRAPH;
  const graph: Graph = { ...home, nodes: home.nodes.map((n) => ({ ...n })) };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialHold = options.hold ?? HOLD_DEFAULT;

  const state = {
    origin: 0,
    hold: initialHold,
    sim: null as PulseSim | null,
    /** Taps in this session, replayed when looping. */
    taps: [] as { node: number; t: number }[],
    lastWave: -1,
    lastWaveStart: 0,
    idleSince: -1,
    playing: false,
    loop: false,
    last: 0,
    raf: 0,
  };
  const drawn = new Map<
    number,
    { dot: SVGCircleElement | null; trail: SVGLineElement }
  >();

  root.replaceChildren();
  root.classList.add('xp');

  // ---- Stage ----------------------------------------------------------------
  const stage = html('div', { class: 'xp-stage' });
  const stageSvg = svg('svg', {
    viewBox: `0 0 ${graph.width} ${graph.height}`,
    class: 'xp-svg',
    role: 'group',
    'aria-label':
      'Seven points joined by paths. Press a point to send a pulse; drag it, or use arrow keys, to move it.',
  });
  stage.appendChild(stageSvg);
  const edgeLayer = svg('g', { class: 'xp-edges' }, stageSvg);
  const traceLayer = svg('g', { class: 'xp-traces' }, stageSvg);
  const pulseLayer = svg(
    'g',
    { class: 'xp-pulses', 'aria-hidden': 'true' },
    stageSvg,
  );
  const nodeLayer = svg('g', { class: 'xp-nodes' }, stageSvg);

  const edgeEls = graph.edges.map(() => svg('line', {}, edgeLayer));

  function layout() {
    graph.edges.forEach(([a, b], i) => {
      const p = graph.nodes[a];
      const q = graph.nodes[b];
      edgeEls[i].setAttribute('x1', String(p.x));
      edgeEls[i].setAttribute('y1', String(p.y));
      edgeEls[i].setAttribute('x2', String(q.x));
      edgeEls[i].setAttribute('y2', String(q.y));
    });
    nodeEls.forEach(({ g }, i) =>
      g.setAttribute(
        'transform',
        `translate(${graph.nodes[i].x} ${graph.nodes[i].y})`,
      ),
    );
  }

  const nodeEls = graph.nodes.map((node, i) => {
    const g = svg(
      'g',
      {
        class: 'xp-node',
        tabindex: 0,
        role: 'button',
        'aria-label': `Point ${node.id}. Enter sends a pulse; arrow keys move it.`,
      },
      nodeLayer,
    );
    svg('circle', { class: 'xp-hit', r: 34 }, g);
    const body = svg('g', { class: 'xp-body' }, g);
    svg('circle', { class: 'xp-ring', r: 10 }, body);
    const label = svg('text', { class: 'xp-label', x: 0, y: -20 }, g);
    label.textContent = node.id;

    let drag: { x: number; y: number; moved: boolean } | null = null;
    g.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      g.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, moved: false };
    });
    g.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (
        !drag.moved &&
        Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5
      ) {
        drag.moved = true;
        stop();
      }
      if (!drag.moved) return;
      const m = stageSvg.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      moveTo(i, p.x, p.y);
    });
    const end = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) start(i);
      else root.classList.add('is-moved');
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', () => (drag = null));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start(i);
        return;
      }
      const dx = e.key === 'ArrowLeft' ? -10 : e.key === 'ArrowRight' ? 10 : 0;
      const dy = e.key === 'ArrowUp' ? -10 : e.key === 'ArrowDown' ? 10 : 0;
      if (dx || dy) {
        e.preventDefault();
        stop();
        moveTo(i, graph.nodes[i].x + dx, graph.nodes[i].y + dy);
        root.classList.add('is-moved');
      }
    });
    return { g, body };
  });

  function moveTo(i: number, x: number, y: number) {
    graph.nodes[i].x = Math.max(PAD, Math.min(graph.width - PAD, x));
    graph.nodes[i].y = Math.max(PAD, Math.min(graph.height - PAD, y));
    layout();
    updatePreview();
  }

  // ---- Score ----------------------------------------------------------------
  const score = html('div', { class: 'xp-score' });
  const scoreSvg = svg('svg', {
    viewBox: '0 0 640 54',
    class: 'xp-score-svg',
    'aria-hidden': 'true',
    preserveAspectRatio: 'none',
  });
  svg(
    'line',
    { class: 'xp-score-axis', x1: 12, y1: 34, x2: 628, y2: 34 },
    scoreSvg,
  );
  const marks = graph.nodes.map((node) => {
    const g = svg('g', { class: 'xp-mark' }, scoreSvg);
    svg('line', { x1: 0, y1: 26, x2: 0, y2: 42 }, g);
    const t = svg('text', { x: 0, y: 16 }, g);
    t.textContent = node.id;
    return g;
  });
  const playhead = svg(
    'line',
    { class: 'xp-playhead', x1: 0, y1: 22, x2: 0, y2: 46 },
    scoreSvg,
  );
  const caption = html('p', { class: 'xp-order', 'aria-live': 'polite' });
  score.append(scoreSvg, caption);

  // ---- Controls -------------------------------------------------------------
  const controls = html('div', { class: 'xp-controls' });
  const holdId = `xp-hold-${Math.random().toString(36).slice(2, 7)}`;
  const holdWrap = html('div', { class: 'xp-hold' });
  const holdLabel = html('label', { for: holdId });
  holdLabel.append('Pause at each point ');
  const holdValue = html('output', { for: holdId });
  holdLabel.append(holdValue);
  const holdInput = html('input', {
    id: holdId,
    type: 'range',
    min: HOLD_MIN,
    max: HOLD_MAX,
    step: 10,
    value: state.hold,
  });
  holdWrap.append(holdLabel, holdInput);

  const buttons = html('div', { class: 'xp-buttons' });
  const playBtn = html('button', { type: 'button' }, 'Play');
  const resetBtn = html('button', { type: 'button' }, 'Reset');
  const loopBtn = html(
    'button',
    { type: 'button', 'aria-pressed': 'false' },
    'Loop',
  );
  const soundBtn = html(
    'button',
    { type: 'button', 'aria-pressed': String(soundEnabled()) },
    soundEnabled() ? 'Sound on' : 'Sound off',
  );
  buttons.append(playBtn, resetBtn, loopBtn, soundBtn);
  controls.append(holdWrap, buttons);

  const hint = html(
    'p',
    { class: 'xp-hint' },
    'Tap a point to send a pulse, then tap another: waves that meet cancel out. Drag a point to change the distances.',
  );
  if (options.bare) {
    root.classList.add('is-bare');
    root.append(stage);
  } else root.append(stage, score, controls, hint);

  // ---- Rendering ------------------------------------------------------------
  const scale = () =>
    Math.max(
      ...schedule(graph, state.origin, HOLD_MAX).fire.filter(Number.isFinite),
      1,
    );

  function drawScore(plan: Wave) {
    const max = scale();
    plan.fire.forEach((t, i) => {
      const x = 12 + (Math.min(t, max) / max) * 616;
      marks[i].setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
      marks[i].classList.toggle('is-origin', i === plan.origin);
    });
    const names = plan.order.map((i) => graph.nodes[i].id).join(' · ');
    caption.textContent = `From ${graph.nodes[plan.origin].id}, the points fire in this order: ${names}`;
  }

  function drawPlayhead() {
    const t = (state.sim?.t ?? 0) - state.lastWaveStart;
    if (!state.sim || !state.playing || reduced.matches) {
      playhead.style.opacity = '0';
      return;
    }
    const max = scale();
    const x = 12 + (Math.min(t, max) / max) * 616;
    playhead.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
    playhead.style.opacity = t <= max ? '1' : '0';
  }

  function updatePreview() {
    holdValue.textContent = `${state.hold} ms`;
    drawScore(schedule(graph, state.origin, state.hold));
  }

  function clearDrawn() {
    pulseLayer.replaceChildren();
    traceLayer.replaceChildren();
    drawn.clear();
  }

  function fireNode(i: number, latest: boolean) {
    const { body } = nodeEls[i];
    body.classList.remove('is-lit', 'is-yield');
    void body.getBoundingClientRect();
    body.classList.add('is-lit');
    if (!reduced.matches) body.classList.add('is-yield');
    window.setTimeout(() => body.classList.remove('is-lit'), 160);
    if (latest) marks[i].classList.add('is-hit');
    pluck(i);
  }

  function spark(x: number, y: number) {
    if (reduced.matches) return;
    const c = svg(
      'circle',
      { class: 'xp-spark', cx: x, cy: y, r: 9 },
      pulseLayer,
    );
    window.setTimeout(() => c.remove(), 700);
    thud(0.35);
  }

  function handle(e: SimEvent) {
    if (e.type === 'fire') {
      fireNode(e.node, e.wave === state.lastWave);
      if (e.pulse && reduced.matches) trailFor(e.pulse).classList.add('is-on');
    } else if (e.type === 'collide') spark(e.x, e.y);
  }

  function trailFor(p: SimPulse) {
    let d = drawn.get(p.id);
    if (!d) {
      const a = graph.nodes[p.from];
      const b = graph.nodes[p.to];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const trail = svg(
        'line',
        {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          'stroke-dasharray': len,
          'stroke-dashoffset': len,
        },
        traceLayer,
      );
      trail.dataset.len = String(len);
      const dot = reduced.matches ? null : svg('circle', { r: 4 }, pulseLayer);
      d = { dot, trail };
      drawn.set(p.id, d);
    }
    return d.trail;
  }

  function render() {
    const sim = state.sim;
    if (!sim) return;
    for (const p of sim.pulses) {
      trailFor(p);
      const { dot, trail } = drawn.get(p.id)!;
      const f = sim.progress(p);
      const len = Number(trail.dataset.len);
      if (p.alive) {
        // A pulse heading to a point its wave already reached is drawn grey.
        trail.classList.toggle('is-on', !p.doomed && !reduced.matches);
        trail.setAttribute('stroke-dashoffset', (len * (1 - f)).toFixed(2));
        if (dot) {
          const a = graph.nodes[p.from];
          const b = graph.nodes[p.to];
          dot.setAttribute('cx', (a.x + (b.x - a.x) * f).toFixed(2));
          dot.setAttribute('cy', (a.y + (b.y - a.y) * f).toFixed(2));
          dot.classList.toggle('wins', !p.doomed);
          dot.style.opacity = '1';
        }
      } else {
        if (p.outcome === 'fired') {
          trail.classList.add('is-on');
          trail.setAttribute('stroke-dashoffset', '0');
        } else trail.classList.remove('is-on');
        if (dot) {
          const since = sim.t - p.end;
          dot.style.opacity =
            p.outcome === 'absorbed' && since < 120 ? '0.25' : '0';
        }
      }
    }
  }

  function setPlaying(on: boolean) {
    state.playing = on;
    playBtn.textContent = on
      ? 'Pause'
      : state.sim && !state.sim.idle()
        ? 'Resume'
        : 'Play';
    if (on) {
      state.last = performance.now();
      cancelAnimationFrame(state.raf);
      state.raf = requestAnimationFrame(frame);
    }
    drawPlayhead();
  }

  function newSession() {
    state.sim = new PulseSim(graph, state.hold);
    state.taps = [];
    state.idleSince = -1;
    clearDrawn();
    marks.forEach((m) => m.classList.remove('is-hit'));
    nodeEls.forEach((n) => n.g.classList.remove('is-origin'));
  }

  /** Sends a new wave from `origin`, alongside any waves already running. */
  function start(origin: number) {
    if (!state.sim || state.sim.idle()) newSession();
    const sim = state.sim!;
    sim.hold = state.hold;
    state.origin = origin;
    updatePreview();
    state.taps.push({ node: origin, t: sim.t });
    const e = sim.tap(origin);
    if (e.type === 'fire') state.lastWave = e.wave;
    state.lastWaveStart = sim.t;
    state.idleSince = -1;
    marks.forEach((m) => m.classList.remove('is-hit'));
    nodeEls[origin].g.classList.add('is-origin');
    handle(e);
    setPlaying(true);
  }

  function frame(now: number) {
    const sim = state.sim;
    if (!state.playing || !sim) return;
    const dt = Math.min(now - state.last, 50);
    state.last = now;
    sim.hold = state.hold;
    for (const e of sim.advance(sim.t + dt)) handle(e);
    render();
    drawPlayhead();

    if (sim.idle()) {
      if (state.idleSince < 0) state.idleSince = sim.t;
      const quiet = sim.t - state.idleSince;
      if (state.loop && quiet > REST_BETWEEN_LOOPS) {
        const taps = state.taps;
        const t0 = taps[0]?.t ?? 0;
        newSession();
        state.taps = taps.map((k) => ({ node: k.node, t: k.t - t0 }));
        for (const k of state.taps) {
          state.sim!.tapAt(k.node, k.t);
          nodeEls[k.node].g.classList.add('is-origin');
        }
        state.lastWave = state.taps.length - 1;
        state.lastWaveStart = state.taps[state.taps.length - 1]?.t ?? 0;
      } else if (!state.loop && quiet > 150) {
        pulseLayer.replaceChildren();
        drawn.forEach((d) => (d.dot = null));
        setPlaying(false);
        return;
      }
    }
    state.raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(state.raf);
    state.sim = null;
    clearDrawn();
    marks.forEach((m) => m.classList.remove('is-hit'));
    nodeEls.forEach((n) => n.g.classList.remove('is-origin'));
    setPlaying(false);
  }

  function reset() {
    graph.nodes.forEach((n, i) => {
      n.x = home.nodes[i].x;
      n.y = home.nodes[i].y;
    });
    state.hold = initialHold;
    holdInput.value = String(initialHold);
    state.origin = 0;
    root.classList.remove('is-moved');
    stop();
    layout();
    updatePreview();
  }

  // ---- Wiring ---------------------------------------------------------------
  holdInput.addEventListener('input', () => {
    state.hold = Number(holdInput.value);
    updatePreview();
  });
  playBtn.addEventListener('click', () => {
    if (state.playing) setPlaying(false);
    else if (state.sim && !state.sim.idle()) setPlaying(true);
    else start(state.origin);
  });
  resetBtn.addEventListener('click', reset);
  loopBtn.addEventListener('click', () => {
    state.loop = !state.loop;
    loopBtn.setAttribute('aria-pressed', String(state.loop));
  });
  soundBtn.addEventListener('click', () => {
    setSoundEnabled(!soundEnabled());
    soundBtn.setAttribute('aria-pressed', String(soundEnabled()));
    soundBtn.textContent = soundEnabled() ? 'Sound on' : 'Sound off';
  });
  const onVisibility = () => {
    if (document.hidden && state.playing) setPlaying(false);
  };
  document.addEventListener('visibilitychange', onVisibility);

  layout();
  updatePreview();
  drawPlayhead();

  return () => {
    cancelAnimationFrame(state.raf);
    document.removeEventListener('visibilitychange', onVisibility);
    root.replaceChildren();
  };
}
