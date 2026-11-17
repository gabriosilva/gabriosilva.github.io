'use client';

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '@/lib/hooks';
import { clamp, ease, lerp } from '@/lib/pen';
import {
  FADE,
  createMeadow,
  plant,
  step,
  type Flower,
  type Meadow,
} from '@/lib/contraptions/meadow';
import { Cut, Surfaces, TexContext } from './FerryPaper';

// A fractal tree in cut paper, on a hill where flowers grow.
//
// The tree is one rule, repeated: every branch ends in two smaller branches,
// turned left and right by the same angle. The flowers are a small simulated
// world (see lib/contraptions/meadow.ts): a seed number decides which ones
// sprout where, and each grows, blooms, drops seeds of its own and fades.

const W = 320;
const H = 250;
const ROOT = { x: 160, y: 226 };
const TRUNK = 56;
const RATIO = 0.72; // each branch is this much of the one before
const ANGLE = { min: 6, max: 75, start: 26 };
const DEPTH = { min: 1, max: 9, start: 8 };
const FIRST_SEED = 7;

const PETALS = ['#e86a8a', '#f0a43c', '#fffdf6', '#7d6fd0', '#e8843a'];
const f = (v: number) => v.toFixed(1);

/** The hill: two curves, also used to stand the flowers on it. */
const HILL = `M-6 ${H + 6} V${ROOT.y + 6} Q80 ${ROOT.y - 12} 160 ${ROOT.y - 4} T${W + 6} ${ROOT.y + 2} V${H + 6} Z`;
function groundY(x: number) {
  const q = (t: number, a: number, b: number, c: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  return x < 160
    ? q(clamp((x + 6) / 166), ROOT.y + 6, ROOT.y - 12, ROOT.y - 4)
    : q(clamp((x - 160) / 166), ROOT.y - 4, ROOT.y + 4, ROOT.y + 2);
}

/** All the wood as one shape, and the leaves as two (for two greens). */
function grow(angleDeg: number, depth: number) {
  const a = (angleDeg * Math.PI) / 180;
  let wood = '';
  const leaves = ['', ''];
  let tip = 0;
  const branch = (
    x: number,
    y: number,
    dir: number,
    len: number,
    width: number,
    level: number,
  ) => {
    const ux = Math.sin(dir);
    const uy = -Math.cos(dir);
    const nx = Math.cos(dir);
    const ny = Math.sin(dir);
    const x2 = x + ux * len;
    const y2 = y + uy * len;
    const w1 = width / 2;
    const w2 = (width * RATIO) / 2;
    wood += `M${f(x - nx * w1)} ${f(y - ny * w1)} L${f(x2 - nx * w2)} ${f(y2 - ny * w2)} L${f(x2 + nx * w2)} ${f(y2 + ny * w2)} L${f(x + nx * w1)} ${f(y + ny * w1)} Z `;
    if (level === depth) {
      const s = 3 + len * 0.5;
      leaves[tip++ % 2] +=
        `M${f(x2)} ${f(y2)} L${f(x2 + ux * s * 0.5 - nx * s * 0.36)} ${f(y2 + uy * s * 0.5 - ny * s * 0.36)} L${f(x2 + ux * s)} ${f(y2 + uy * s)} L${f(x2 + ux * s * 0.5 + nx * s * 0.36)} ${f(y2 + uy * s * 0.5 + ny * s * 0.36)} Z `;
      return;
    }
    branch(x2, y2, dir - a, len * RATIO, width * RATIO, level + 1);
    branch(x2, y2, dir + a, len * RATIO, width * RATIO, level + 1);
  };
  branch(ROOT.x, ROOT.y, 0, TRUNK, 9, 1);
  return { wood, leaves, branches: 2 ** depth - 1 };
}

/** Where a flower stands and how far along it is, at world time t. */
function pose(fl: Flower, t: number) {
  const age = t - fl.born;
  const up = ease(clamp(age / 4));
  const open = ease(clamp((age - 3.5) / 2.5));
  const fade = clamp((age - fl.life) / FADE);
  const base = groundY(fl.x) + 3;
  const h = fl.height * up * (1 - fade * 0.4);
  const wind = Math.sin(t * 1.3 + fl.id) * 1.5 * up;
  return {
    up,
    open,
    fade,
    base,
    x: fl.x + fl.lean * up + wind + fade * 4,
    y: base - h,
  };
}

const disc = (x: number, y: number, r: number) =>
  `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;

// A bloom's outline never changes: it is drawn once at full size around
// (0, 0), then only moved and scaled. That keeps each frame cheap.
const blooms = new WeakMap<Flower, string>();
function bloomOf(fl: Flower) {
  let d = blooms.get(fl);
  if (!d) {
    d = '';
    for (let i = 0; i < fl.petals; i++) {
      const a = (i / fl.petals) * Math.PI * 2 + fl.id;
      d += disc(
        Math.cos(a) * fl.size * 0.78,
        Math.sin(a) * fl.size * 0.78,
        fl.size * 0.62,
      );
    }
    blooms.set(fl, d);
  }
  return d;
}

function FlowerShape({ fl, t }: { fl: Flower; t: number }) {
  const p = pose(fl, t);
  if (p.up <= 0) return null;
  const midY = lerp(p.base, p.y, 0.45);
  const midX = lerp(fl.x, p.x, 0.3);
  return (
    <g opacity={f(1 - p.fade)}>
      <path
        d={`M${f(fl.x)} ${f(p.base)} Q${f(fl.x)} ${f(lerp(p.base, p.y, 0.6))} ${f(p.x)} ${f(p.y)}`}
        fill="none"
        stroke="#4f8a45"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {p.up > 0.5 && (
        <path
          d={`M${f(midX)} ${f(midY)} l${fl.lean > 0 ? -5 : 5} -2.5 l${fl.lean > 0 ? 1.5 : -1.5} 3.5 Z`}
          fill="#6aa258"
        />
      )}
      {p.open < 0.25 ? (
        <circle cx={f(p.x)} cy={f(p.y)} r={f(1.7 * p.up)} fill="#5f9a52" />
      ) : (
        <g
          transform={`translate(${f(p.x)} ${f(p.y)}) scale(${p.open.toFixed(2)})`}
        >
          <path
            d={bloomOf(fl)}
            transform="translate(1.2 1.2)"
            fill="#1c1b18"
            opacity={0.2}
          />
          <path
            d={bloomOf(fl)}
            fill={PETALS[fl.hue]}
            stroke="#fff"
            strokeOpacity={0.4}
            strokeWidth={0.5}
          />
          <circle
            r={f(fl.size * 0.42)}
            fill={fl.hue === 1 || fl.hue === 4 ? '#6b4a2a' : '#f7c15e'}
          />
        </g>
      )}
    </g>
  );
}

// The scene is four stacked drawings, so that the textured parts are only
// redrawn when they actually change:
//   1. the sheet of paper behind everything (never changes)
//   2. the tree (changes with the angle and repeats; its breathing is a
//      transform of the whole layer, which costs nothing to draw)
//   3. the hill (never changes)
//   4. the flowers and flying seeds (every frame, but plain shapes)

const Sheet = memo(function Sheet({ uid }: { uid: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <Surfaces uid={uid} />
      </defs>
      <rect width={W} height={H} fill="#e6edea" />
      <rect width={W} height={H} fill={`url(#tx-creased0-${uid})`} />
    </svg>
  );
});

const Wood = memo(function Wood({
  uid,
  wood,
  leaves,
}: {
  uid: string;
  wood: string;
  leaves: string[];
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="tree-layer tree-wood"
      aria-hidden="true"
    >
      <TexContext.Provider value={uid}>
        <defs>
          <Surfaces uid={uid} />
        </defs>
        <Cut drop d={wood} fill="#9a7446" surface="kraft" />
        <Cut drop d={leaves[0]} fill="#5f9a52" surface="crumple" />
        <Cut drop d={leaves[1]} fill="#86b86a" surface="crumple" turn={1} />
      </TexContext.Provider>
    </svg>
  );
});

const Hill = memo(function Hill({ uid }: { uid: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tree-layer" aria-hidden="true">
      <TexContext.Provider value={uid}>
        <defs>
          <Surfaces uid={uid} />
        </defs>
        <Cut drop d={HILL} fill="#8db574" surface="creased" turn={1} />
      </TexContext.Provider>
    </svg>
  );
});

export default function FractalTree() {
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewRef, inView] = useInView<HTMLDivElement>(0.3);
  const [angle, setAngle] = useState(ANGLE.start);
  const [depth, setDepth] = useState(DEPTH.start);
  const [seed, setSeed] = useState(FIRST_SEED);
  const [, setFrame] = useState(0); // redraws as the world moves on
  const world = useRef<Meadow>(createMeadow(FIRST_SEED, W));
  const press = useRef<{ x: number; moved: boolean } | null>(null);

  const headOf = (fl: Flower) => pose(fl, world.current.t);

  // A new seed is a new meadow.
  useEffect(() => {
    world.current = createMeadow(seed, W);
    if (reduced) {
      // Without motion, show it already grown.
      for (let i = 0; i < 140; i++) step(world.current, 0.1, headOf);
    }
    setFrame((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, reduced]);

  // Time passes while the drawing is on screen.
  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(world.current, dt, headOf);
      setFrame((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  const m = world.current;
  const tree = useMemo(() => grow(angle, depth), [angle, depth]);

  const pointAt = (e: React.PointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM();
    return ctm
      ? new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
      : null;
  };

  return (
    <div className="tree" ref={viewRef}>
      <div
        className="ferry-stage"
        role="img"
        aria-label={`A paper tree made by one rule repeated ${depth} times: every branch ends in two smaller branches, ${angle} degrees to each side, ${tree.branches} branches in all. On the hill below, ${m.flowers.length} flowers grown from seed ${seed}.`}
      >
        <Sheet uid={`${uid}a`} />
        <Wood uid={`${uid}b`} wood={tree.wood} leaves={tree.leaves} />
        <Hill uid={`${uid}c`} />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="tree-layer tree-svg"
          aria-hidden="true"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            press.current = { x: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            const hold = press.current;
            if (!hold) return;
            if (e.pointerType === 'mouse' && e.buttons === 0) {
              press.current = null;
              return;
            }
            // A small threshold, so scrolling past on a phone doesn't bend it.
            if (!hold.moved && Math.abs(e.clientX - hold.x) > 4)
              hold.moved = true;
            const p = pointAt(e);
            if (hold.moved && p)
              setAngle(
                Math.round(
                  lerp(ANGLE.min, ANGLE.max, clamp((p.x - 24) / (W - 48))),
                ),
              );
          }}
          onPointerUp={(e) => {
            const hold = press.current;
            press.current = null;
            const p = pointAt(e);
            // A tap plants a flower there.
            if (hold && !hold.moved && p && plant(world.current, p.x))
              setFrame((n) => n + 1);
          }}
          onPointerCancel={() => (press.current = null)}
        >
          {m.flowers.map((fl) => (
            <FlowerShape key={fl.id} fl={fl} t={m.t} />
          ))}
          {m.seeds.map((sd) => {
            const k = clamp((m.t - sd.t0) / sd.dur);
            return (
              <circle
                key={sd.id}
                cx={f(lerp(sd.x0, sd.x1, k))}
                cy={f(
                  lerp(sd.y0, groundY(sd.x1), k) - Math.sin(Math.PI * k) * 14,
                )}
                r={1.2}
                fill="#6b4a2a"
              />
            );
          })}
        </svg>
      </div>

      <div className="xp-controls">
        <div className="xp-hold">
          <label htmlFor={`${uid}-angle`}>
            Angle <output htmlFor={`${uid}-angle`}>{angle}°</output>
          </label>
          <input
            id={`${uid}-angle`}
            type="range"
            min={ANGLE.min}
            max={ANGLE.max}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </div>
        <div className="xp-hold">
          <label htmlFor={`${uid}-depth`}>
            Repeats{' '}
            <output htmlFor={`${uid}-depth`}>
              {depth} · {tree.branches} branches
            </output>
          </label>
          <input
            id={`${uid}-depth`}
            type="range"
            min={DEPTH.min}
            max={DEPTH.max}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="tree-seed">
        <label htmlFor={`${uid}-seed`}>Seed</label>
        <input
          id={`${uid}-seed`}
          type="number"
          min={1}
          max={9999}
          value={seed}
          onChange={(e) =>
            setSeed(clamp(Math.round(Number(e.target.value) || 1), 1, 9999))
          }
        />
        <button
          type="button"
          onClick={() => setSeed(1 + Math.floor(Math.random() * 9999))}
        >
          New seed
        </button>
        <span className="tree-count" aria-live="off">
          {m.flowers.length} {m.flowers.length === 1 ? 'flower' : 'flowers'}
        </span>
      </div>
      <p className="xp-hint">
        Drag across the tree to change the angle. Tap the hill to plant a
        flower.
      </p>
    </div>
  );
}
