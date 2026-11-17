// Event-driven version of the pulse model, so several waves can run at once.
//
// With a single wave it gives exactly the same firing times as `schedule()`.
// Waves started from different points also interact:
// - two pulses from different waves meeting head-on on a path cancel out;
// - a point that just fired for one wave ignores another wave's pulses for a
//   short while (it is "tired"), so the second wave stops there.

import { SPEED, edgeLength, type Graph } from './pulse-model';

export const TIRED_MS = 900;

export type SimPulse = {
  id: number;
  wave: number;
  edge: number;
  from: number;
  to: number;
  start: number;
  end: number;
  alive: boolean;
  /** Its target has already fired for this wave, so it will be absorbed. */
  doomed: boolean;
  outcome?: 'fired' | 'absorbed' | 'collided';
};

export type SimEvent =
  | { type: 'fire'; t: number; node: number; wave: number; pulse?: SimPulse }
  | { type: 'absorb'; t: number; node: number; pulse: SimPulse }
  | {
      type: 'collide';
      t: number;
      x: number;
      y: number;
      a: SimPulse;
      b: SimPulse;
    };

type Departure = { t: number; node: number; wave: number; came: number };
type PendingTap = { t: number; node: number };

export class PulseSim {
  t = 0;
  hold: number;
  pulses: SimPulse[] = [];
  private graph: Graph;
  private departures: Departure[] = [];
  private taps: PendingTap[] = [];
  private firedBy = new Map<number, Set<number>>();
  private lastFire: { t: number; wave: number }[] = [];
  private waveCount = 0;
  private pulseCount = 0;

  constructor(graph: Graph, hold: number) {
    this.graph = graph;
    this.hold = hold;
    this.lastFire = graph.nodes.map(() => ({ t: -Infinity, wave: -1 }));
  }

  /** Starts a new wave at `node` now. Returns the fire event. */
  tap(node: number): SimEvent {
    return this.fire(node, this.newWave(), this.t, -1);
  }

  /** Queues a tap for a later time (used to replay a loop). */
  tapAt(node: number, t: number) {
    this.taps.push({ node, t });
  }

  /** True when nothing is moving and nothing is waiting to happen. */
  idle() {
    return (
      !this.departures.length &&
      !this.taps.length &&
      !this.pulses.some((p) => p.alive)
    );
  }

  /** Processes everything that happens up to time `to`, in order. */
  advance(to: number): SimEvent[] {
    const out: SimEvent[] = [];
    for (let guard = 0; guard < 10000; guard++) {
      const next = this.nextEvent();
      if (!next || next.t > to) break;
      this.t = next.t;
      const e = next.run();
      if (e) out.push(e);
    }
    this.t = to;
    this.pulses = this.pulses.filter((p) => p.alive || to - p.end < 1500);
    return out;
  }

  /** Where a pulse is at time t, from 0 (start) to 1 (arrived). */
  progress(p: SimPulse, t = this.t) {
    return Math.max(0, Math.min(1, (t - p.start) / (p.end - p.start)));
  }

  private newWave() {
    const w = this.waveCount++;
    this.firedBy.set(w, new Set());
    return w;
  }

  private fire(
    node: number,
    wave: number,
    t: number,
    came: number,
    pulse?: SimPulse,
  ): SimEvent {
    this.firedBy.get(wave)!.add(node);
    this.lastFire[node] = { t, wave };
    this.departures.push({ t: came < 0 ? t : t + this.hold, node, wave, came });
    // Pulses of this wave already heading here will now be absorbed.
    for (const p of this.pulses)
      if (p.alive && p.wave === wave && p.to === node) p.doomed = true;
    return { type: 'fire', t, node, wave, pulse };
  }

  private nextEvent(): { t: number; run: () => SimEvent | null } | null {
    let best: { t: number; run: () => SimEvent | null } | null = null;
    const consider = (t: number, run: () => SimEvent | null) => {
      if (!best || t < best.t - 1e-9) best = { t, run };
    };

    for (const tap of this.taps)
      consider(tap.t, () => {
        this.taps.splice(this.taps.indexOf(tap), 1);
        return this.fire(tap.node, this.newWave(), tap.t, -1);
      });

    for (const d of this.departures)
      consider(d.t, () => {
        this.departures.splice(this.departures.indexOf(d), 1);
        this.graph.edges.forEach((e, edge) => {
          if (edge === d.came || (e[0] !== d.node && e[1] !== d.node)) return;
          const to = e[0] === d.node ? e[1] : e[0];
          const len = edgeLength(this.graph.nodes, e);
          this.pulses.push({
            id: this.pulseCount++,
            wave: d.wave,
            edge,
            from: d.node,
            to,
            start: d.t,
            end: d.t + len / SPEED,
            alive: true,
            doomed: this.firedBy.get(d.wave)!.has(to),
          });
        });
        return null;
      });

    const alive = this.pulses.filter((p) => p.alive);
    for (const p of alive)
      consider(p.end, () => {
        p.alive = false;
        const fired = this.firedBy.get(p.wave)!;
        const last = this.lastFire[p.to];
        const tired = last.wave !== p.wave && p.end - last.t < TIRED_MS;
        if (fired.has(p.to) || tired) {
          p.outcome = 'absorbed';
          return { type: 'absorb', t: p.end, node: p.to, pulse: p };
        }
        p.outcome = 'fired';
        return this.fire(p.to, p.wave, p.end, p.edge, p);
      });

    // Head-on meetings between different waves on the same path.
    for (let i = 0; i < alive.length; i++)
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        if (a.edge !== b.edge || a.wave === b.wave || a.from === b.from)
          continue;
        const travel = a.end - a.start;
        const t = (travel + a.start + b.start) / 2;
        if (t < Math.max(a.start, b.start) || t > Math.min(a.end, b.end))
          continue;
        consider(t, () => {
          const f = (t - a.start) / travel;
          a.alive = b.alive = false;
          a.outcome = b.outcome = 'collided';
          a.end = b.end = t;
          const p = this.graph.nodes[a.from];
          const q = this.graph.nodes[a.to];
          return {
            type: 'collide',
            t,
            x: p.x + (q.x - p.x) * f,
            y: p.y + (q.y - p.y) * f,
            a,
            b,
          };
        });
      }

    return best;
  }
}
