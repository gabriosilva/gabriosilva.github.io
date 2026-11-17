// A small, deterministic model of pulses moving through connections.
//
// 1. Pulses travel along every path at the same constant speed.
// 2. When a pulse reaches a point for the first time, the point fires.
// 3. A point that fires waits for `hold` ms, then sends a pulse down each of
//    its other paths.
// 4. A point fires only once per wave; later pulses are absorbed.
//
// Every stop costs `hold`, so a long pause favours routes with fewer stops and
// a short pause favours the shortest distance.

export const SPEED = 0.22; // units per millisecond
export const HOLD_MIN = 0;
export const HOLD_MAX = 600;
export const HOLD_DEFAULT = 40;

export type Point = { id: string; x: number; y: number };
export type Edge = [number, number];
export type Graph = {
  width: number;
  height: number;
  nodes: Point[];
  edges: Edge[];
};

export const GRAPH: Graph = {
  width: 640,
  height: 340,
  nodes: [
    { id: 'A', x: 60, y: 175 },
    { id: 'B', x: 160, y: 95 },
    { id: 'C', x: 265, y: 70 },
    { id: 'D', x: 300, y: 300 },
    { id: 'E', x: 375, y: 120 },
    { id: 'F', x: 480, y: 70 },
    { id: 'G', x: 550, y: 150 },
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 4],
    [4, 5],
    [5, 6],
    [0, 3],
    [3, 6],
    [2, 3],
    [4, 6],
  ],
};

export type Pulse = {
  from: number;
  to: number;
  edge: number;
  start: number;
  end: number;
  wins: boolean;
};

export type Wave = {
  origin: number;
  hold: number;
  fire: number[];
  via: number[];
  pulses: Pulse[];
  order: number[];
  duration: number;
};

export function edgeLength(nodes: Point[], [a, b]: Edge) {
  return Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y);
}

export function schedule(graph: Graph, origin: number, hold: number): Wave {
  const n = graph.nodes.length;
  const adj: { to: number; edge: number; len: number }[][] = graph.nodes.map(
    () => [],
  );
  graph.edges.forEach((e, edge) => {
    const len = edgeLength(graph.nodes, e);
    adj[e[0]].push({ to: e[1], edge, len });
    adj[e[1]].push({ to: e[0], edge, len });
  });

  const fire = new Array<number>(n).fill(Infinity);
  const via = new Array<number>(n).fill(-1);
  const from = new Array<number>(n).fill(-1);
  const done = new Array<boolean>(n).fill(false);
  fire[origin] = 0;

  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++)
      if (!done[i] && (u === -1 || fire[i] < fire[u])) u = i;
    if (u === -1 || fire[u] === Infinity) break;
    done[u] = true;
    const depart = u === origin ? 0 : fire[u] + hold;
    for (const { to, edge, len } of adj[u]) {
      const arrive = depart + len / SPEED;
      if (arrive < fire[to] - 1e-9) {
        fire[to] = arrive;
        via[to] = edge;
        from[to] = u;
      }
    }
  }

  const pulses: Pulse[] = [];
  for (let u = 0; u < n; u++) {
    if (fire[u] === Infinity) continue;
    const depart = u === origin ? 0 : fire[u] + hold;
    for (const { to, edge, len } of adj[u]) {
      if (edge === via[u]) continue;
      pulses.push({
        from: u,
        to,
        edge,
        start: depart,
        end: depart + len / SPEED,
        wins: via[to] === edge && from[to] === u,
      });
    }
  }

  const order = fire
    .map((t, i) => ({ i, t }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((d) => d.i);
  const finite = fire.filter(Number.isFinite);
  return {
    origin,
    hold,
    fire,
    via,
    pulses,
    order,
    duration: Math.max(...pulses.map((p) => p.end), ...finite),
  };
}
