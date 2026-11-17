// Small pen drawings, one per role or project. Each is a pure function of
// progress t (0..1), drawn in a 160×100 box, so the same drawing works as a
// thumbnail, a large figure, or a still frame with reduced motion.

import type { ReactNode } from 'react';
import {
  Cut,
  Surfaces,
  TexContext,
} from '@/components/contraptions/FerryPaper';
import {
  clamp,
  ease,
  easeInOut,
  lerp,
  penLine,
  penPoly,
  penRect,
  phase,
} from '@/lib/pen';

export type Drawing = {
  duration: number;
  label: string;
  draw: (t: number) => ReactNode;
};

const draw = (p: number) => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - clamp(p),
});

// ---- Morgan Stanley: a block trade allocated across accounts ----
const SHARES: [number, string][] = [
  [0.5, '500'],
  [0.3, '300'],
  [0.2, '200'],
];
const allocation: Drawing = {
  duration: 4800,
  label:
    'A block trade of 1,000 is split into three parts, and each part moves into its own account: 500, 300 and 200.',
  draw: (t) => {
    const paths = phase(t, 0.08, 0.22);
    let top = 30;
    return (
      <>
        <text className="tl" x={12} y={22}>
          block trade
        </text>
        <text className="tl" x={104} y={10}>
          accounts
        </text>
        <path className="faint dashed" d={penRect(12, 30, 34, 40, 2, 0.4)} />
        <text className="tl" x={29} y={80} textAnchor="middle">
          1,000
        </text>
        {SHARES.map(([share, label], i) => {
          const h = 40 * share;
          const y0 = top;
          top += h;
          const ay = 16 + i * 26;
          const go = easeInOut(phase(t, 0.28 + i * 0.14, 0.55 + i * 0.14));
          const w = lerp(34, (24 * share) / 0.5, go);
          const hh = lerp(h, 10, go);
          const x = lerp(12, 107, go);
          const y = lerp(y0, ay + 4, go);
          return (
            <g key={i}>
              <path
                className="faint"
                opacity={paths}
                d={`M46 ${y0 + h / 2} C74 ${y0 + h / 2}, 78 ${ay + 9}, 104 ${ay + 9}`}
              />
              <path className="pen" d={penRect(104, ay, 30, 18, i + 20, 0.4)} />
              <rect
                className="fill-accent"
                x={x}
                y={y}
                width={w}
                height={hh}
                opacity={0.2 + 0.5 * go}
              />
              <path
                className={go > 0 ? 'accent' : 'pen'}
                d={penRect(x, y, w, hh, i + 5, 0.3)}
              />
              <text
                className="tl accent-text"
                x={138}
                y={ay + 11.5}
                opacity={phase(go, 0.9, 1)}
              >
                {label}
              </text>
            </g>
          );
        })}
      </>
    );
  },
};

// ---- Morgan Stanley: an invoice on its way to being paid ----
const invoice: Drawing = {
  duration: 4600,
  label:
    'An invoice passes two checks on its way to payment, and is then stamped paid.',
  draw: (t) => {
    const go = easeInOut(phase(t, 0.1, 0.8));
    const x = lerp(42, 138, go);
    const paid = phase(t, 0.82, 0.95);
    return (
      <>
        <path className="pen" d={penRect(14, 26, 28, 38, 3, 0.5)} />
        <path
          className="faint"
          d="M19 34 h18 M19 40 h18 M19 46 h12 M19 56 h8 M31 56 h6"
        />
        <text className="tl" x={14} y={76}>
          invoice
        </text>
        <path className="faint dashed" d="M42 45 L129 45" />
        {[72, 104].map((gx) => {
          const passed = x >= gx;
          return (
            <g key={gx}>
              <circle
                className={passed ? 'accent fill-paper' : 'pen fill-paper'}
                cx={gx}
                cy={45}
                r={7}
              />
              {passed && (
                <path className="accent" d={`M${gx - 3} 45 l2.5 2.5 l4 -5`} />
              )}
            </g>
          );
        })}
        <circle
          className={paid > 0 ? 'accent fill-paper' : 'pen fill-paper'}
          cx={138}
          cy={45}
          r={9}
        />
        <circle className="fill-accent" cx={138} cy={45} r={3.5 * paid} />
        <text className="tl" x={138} y={66} textAnchor="middle">
          payment
        </text>
        {go > 0 && go < 1 && (
          <path
            className="accent fill-paper"
            d={penRect(x - 5, 38.5, 10, 13, 7, 0.3)}
          />
        )}
        <g opacity={paid} transform="rotate(-12 28 45)">
          <rect className="fill-paper" x={15} y={39} width={26} height={12} />
          <path className="accent" d={penRect(15, 39, 26, 12, 9, 0.3)} />
          <text className="tl accent-text" x={28} y={47.5} textAnchor="middle">
            PAID
          </text>
        </g>
      </>
    );
  },
};

// ---- Morgan Stanley: a signature drawn, then validated ----
// "Gabrio" in one continuous stroke, then an underline flourish.
const SIGNATURE =
  'M44 30 C40 20, 22 20, 18 36 C14 52, 24 64, 36 60 C44 57, 47 48, 44 44 C40 42, 34 46, 33 50 ' +
  'C38 50, 44 48, 48 52 ' +
  'C50 46, 58 44, 60 50 C61 55, 56 60, 52 58 C49 56, 52 50, 58 50 C60 54, 60 58, 64 58 ' +
  'C68 58, 70 44, 72 32 C73 24, 68 22, 67 30 C66 40, 66 52, 68 58 C70 62, 78 58, 78 52 C78 48, 72 48, 72 54 C74 58, 78 56, 80 54 ' +
  'C82 52, 82 49, 84 48 C85 52, 84 56, 86 58 C86 52, 90 48, 94 50 ' +
  'C95 54, 95 57, 97 58 C99 57, 100 54, 102 52 ' +
  'C102 49, 108 48, 110 51 C112 55, 108 60, 104 58 C101 56, 103 50, 110 52 ' +
  'C120 54, 132 46, 138 38';
const SIGN_UNDER = 'M28 70 C58 62, 104 64, 148 58 C142 62, 136 64, 132 66';
const signature: Drawing = {
  duration: 4200,
  label:
    'The name Gabrio is signed in one stroke and underlined, then checked in three steps and marked valid.',
  draw: (t) => {
    const valid = phase(t, 0.86, 0.97);
    return (
      <>
        <g transform="translate(6 -4) skewX(-8)">
          <path
            className="pen"
            {...draw(easeInOut(phase(t, 0.02, 0.42)))}
            d={SIGNATURE}
          />
          <circle
            className="fill-ink"
            cx={92.5}
            cy={42}
            r={1}
            opacity={phase(t, 0.42, 0.44)}
          />
          <path className="pen" {...draw(phase(t, 0.44, 0.5))} d={SIGN_UNDER} />
        </g>
        {[0, 1, 2].map((i) => {
          const f = phase(t, 0.52 + i * 0.1, 0.6 + i * 0.1);
          return (
            <g key={i}>
              <path
                className={f >= 1 ? 'accent' : 'faint'}
                d={penRect(18 + i * 20, 76, 12, 12, i + 12, 0.4)}
              />
              <path
                className="accent"
                {...draw(f)}
                d={`M${21 + i * 20} 82 l3 3 l5 -6`}
              />
            </g>
          );
        })}
        <text className="tl accent-text" x={82} y={85} opacity={valid}>
          valid
        </text>
        <path
          className="accent thick"
          {...draw(valid)}
          d="M128 14 l6 7 l12 -14"
        />
      </>
    );
  },
};

// ---- BTG: what an order cost, against the price when it arrived ----
const tcaPrice = (i: number) =>
  52 + Math.sin(i * 0.7) * 6 + Math.sin(i * 1.9) * 3 - i * 0.9;
const tcaFills = [3, 7, 11, 15, 19, 23, 27];
const tca: Drawing = {
  duration: 5200,
  label:
    'A price rises while an order is filled in seven slices. The average fill price drifts away from the price at arrival, and the gap between them is marked as the cost.',
  draw: (t) => {
    const shown = Math.max(2, Math.round(lerp(2, 29, phase(t, 0, 0.8))));
    const line = Array.from(
      { length: shown },
      (_, i) => `${10 + i * 4},${tcaPrice(i).toFixed(1)}`,
    ).join(' ');
    const done = tcaFills.filter((i) => i < shown);
    const avg = done.length
      ? done.reduce((a, i) => a + tcaPrice(i), 0) / done.length
      : tcaPrice(0);
    const arrival = tcaPrice(0);
    const end = phase(t, 0.84, 0.95);
    return (
      <>
        <path className="faint dashed" d={`M10 ${arrival} L124 ${arrival}`} />
        <text className="tl" x={132} y={arrival + 4}>
          arrival
        </text>
        <polyline className="pen" points={line} />
        <path className="faint" d={penLine(10, 94, 124, 94, 6)} />
        {tcaFills.map((i, k) => {
          const on = i < shown;
          const x = 10 + i * 4;
          const h = 5 + ((k * 7) % 5) * 1.6;
          return on ? (
            <g key={i}>
              <circle className="fill-accent" cx={x} cy={tcaPrice(i)} r={2.2} />
              <rect
                className="fill-accent"
                x={x - 3}
                y={94 - h}
                width={6}
                height={h}
                opacity={0.7}
              />
            </g>
          ) : null;
        })}
        {done.length > 0 && (
          <>
            <path
              className="accent"
              d={`M10 ${avg.toFixed(1)} L124 ${avg.toFixed(1)}`}
            />
            <text
              className="tl accent-text"
              x={132}
              y={avg + 1}
              opacity={arrival - avg > 9 ? 1 : 0}
            >
              avg fill
            </text>
          </>
        )}
        <g opacity={end}>
          <path
            className="accent"
            d={`M127 ${arrival} h2 V${avg.toFixed(1)} h-2`}
          />
          <text
            className="tl accent-text"
            x={132}
            y={(arrival + avg) / 2 + 2.5}
          >
            cost
          </text>
        </g>
      </>
    );
  },
};

// ---- Descomplica: a pod fails and is replaced ----
const cluster: Drawing = {
  duration: 4200,
  label:
    'Six services in a cluster; one fails and a replacement starts in its place.',
  draw: (t) => {
    const fail = phase(t, 0.28, 0.4);
    const born = phase(t, 0.55, 0.75);
    const pulse = Math.sin(phase(t, 0.42, 0.62) * Math.PI);
    return (
      <>
        <circle className="pen" cx={80} cy={14} r={6} />
        <circle className="fill-accent" cx={80} cy={14} r={2 + pulse * 2} />
        {Array.from({ length: 6 }, (_, i) => {
          const x = 22 + (i % 3) * 42;
          const y = 36 + Math.floor(i / 3) * 30;
          const failing = i === 4;
          return (
            <g key={i}>
              <path
                className="faint"
                d={penLine(80, 20, x + 14, y, i + 30, 0.6)}
                opacity={failing ? 1 - fail * 0.7 : 1}
              />
              {failing ? (
                <>
                  <path
                    className="pen dashed"
                    d={penRect(x, y, 28, 18, 50)}
                    opacity={1 - born}
                  />
                  <path
                    className="pen"
                    d={`M${x + 8} ${y + 5} l12 8 M${x + 20} ${y + 5} l-12 8`}
                    opacity={fail * (1 - born)}
                  />
                  <path
                    className="accent"
                    d={penRect(x, y, 28, 18, 51)}
                    opacity={born}
                  />
                  <rect
                    className="fill-accent"
                    x={x}
                    y={y}
                    width={28}
                    height={18}
                    opacity={0.15 * born}
                  />
                </>
              ) : (
                <path className="pen" d={penRect(x, y, 28, 18, i + 40)} />
              )}
            </g>
          );
        })}
      </>
    );
  },
};

// ---- Adapta AI Challenge: a recorded path, then an agent replaying it ----
const replayPath =
  'M18 78 C34 70, 30 40, 46 30 S70 24, 78 44 S98 76, 112 60 S128 24, 142 22';
const replayTargets: [number, number][] = [
  [46, 30],
  [112, 60],
  [142, 22],
];
const replay: Drawing = {
  duration: 5200,
  label:
    'Inside a browser window, a person’s cursor path is recorded, then an agent follows it on its own and clicks the same buttons.',
  draw: (t) => {
    const rec = phase(t, 0.02, 0.4);
    const run = phase(t, 0.48, 0.95);
    return (
      <>
        <path className="pen" d={penRect(8, 6, 144, 78, 55, 0.6)} />
        <path className="faint" d="M8 17 H152" />
        <circle className="fill-ink" cx={14} cy={11.5} r={1.3} />
        <circle className="fill-ink" cx={19} cy={11.5} r={1.3} />
        <circle className="fill-ink" cx={24} cy={11.5} r={1.3} />
        <path className="faint" d={penRect(34, 8.5, 80, 6, 56, 0.2)} />
        <g transform="translate(8 14) scale(0.9 0.82)">
          {replayTargets.map(([x, y], i) => (
            <path
              key={i}
              className="faint"
              d={penRect(x - 9, y - 6, 18, 12, i + 60)}
            />
          ))}
          <path className="pen dashed" {...draw(rec)} d={replayPath} />
          <path className="accent" {...draw(easeInOut(run))} d={replayPath} />
          {replayTargets.map(([x, y], i) => {
            const at = 0.48 + (0.47 * (i + 1)) / 3.2;
            const ring = phase(t, at, at + 0.08);
            return ring > 0 && ring < 1 ? (
              <circle
                key={i}
                className="accent"
                cx={x}
                cy={y}
                r={4 + ring * 8}
                opacity={1 - ring}
              />
            ) : null;
          })}
        </g>
        <text className="tl" x={10} y={95} opacity={run > 0 ? 0 : 1}>
          recording
        </text>
        <text
          className="tl accent-text"
          x={10}
          y={95}
          opacity={run > 0 ? 1 : 0}
        >
          agent replaying
        </text>
      </>
    );
  },
};

// ---- Nutrition app: three meals add up over a day ----
const MEALS: [number, number, number][] = [
  [0.2, 0.3, 0.1],
  [0.25, 0.25, 0.2],
  [0.2, 0.25, 0.12],
];
const nutrition: Drawing = {
  duration: 5000,
  label:
    'Three meals are logged through a day, and each one adds to running totals of protein, carbs and fat.',
  draw: (t) => {
    const eaten = [0, 1, 2].map((i) =>
      ease(phase(t, 0.06 + i * 0.3, 0.26 + i * 0.3)),
    );
    const names = ['protein', 'carbs', 'fat'];
    return (
      <>
        {eaten.map((f, i) => {
          const y = 22 + i * 28;
          return (
            <g key={i} opacity={0.15 + 0.85 * f}>
              <circle
                className={f > 0 && f < 1 ? 'accent' : 'pen'}
                cx={24}
                cy={y}
                r={10}
              />
              <circle className="faint" cx={24} cy={y} r={6.5} />
              {i === 0 && <path className="pen" d="M20 21 q4 -4 8 1" />}
              {i === 1 && (
                <path
                  className="pen"
                  d="M20 48 l5 -3 l3 5 l-5 3 z M28 54 l2 -2"
                />
              )}
              {i === 2 && (
                <>
                  <circle className="pen" cx={22} cy={77} r={2.5} />
                  <path className="pen" d="M26 80 q3 -5 4 0" />
                </>
              )}
              <path
                className="faint dashed"
                d={`M36 ${y} L62 ${y}`}
                opacity={f > 0 && f < 1 ? 1 : 0}
              />
            </g>
          );
        })}
        <text className="tl" x={68} y={14}>
          today
        </text>
        {names.map((name, k) => {
          const y = 32 + k * 22;
          let x = 68;
          return (
            <g key={name}>
              <text className="tl" x={68} y={y - 4}>
                {name}
              </text>
              <path
                className="faint"
                d={penLine(68, y + 2, 150, y + 2, k + 5)}
              />
              {MEALS.map((m, i) => {
                const w = 82 * m[k] * eaten[i];
                const x0 = x;
                x += w + (w > 0 ? 1 : 0);
                return (
                  <path
                    key={i}
                    className="accent thick"
                    d={`M${x0.toFixed(1)} ${y + 2} L${(x0 + w).toFixed(1)} ${y + 2}`}
                    opacity={w > 0.5 ? 1 : 0}
                  />
                );
              })}
            </g>
          );
        })}
      </>
    );
  },
};

// ---- RL trade matching: an agent learning how much to match ----
const rl: Drawing = {
  duration: 5000,
  label:
    'An agent chooses how much of a spot purchase to match against a forward sale; its choice swings, then settles on the target as its reward rises.',
  draw: (t) => {
    const target = 46;
    const level = target + Math.exp(-4 * t) * Math.sin(t * 26) * 26;
    const reward = Array.from(
      { length: Math.max(2, Math.round(t * 24)) },
      (_, i) => {
        const x = 96 + i * 2.3;
        const y = 90 - (1 - Math.exp(-i / 6)) * 20 - Math.sin(i * 2.3) * 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      },
    ).join(' ');
    return (
      <>
        <text className="tl" x={18} y={14}>
          spot
        </text>
        <text className="tl" x={52} y={14}>
          forward
        </text>
        <rect
          className="fill-accent"
          x={18}
          y={level}
          width={22}
          height={90 - level}
          opacity={0.22}
        />
        <rect
          className="fill-accent"
          x={52}
          y={level}
          width={22}
          height={90 - level}
          opacity={0.22}
        />
        <path className="pen" d={penRect(18, 20, 22, 70, 3)} />
        <path className="pen" d={penRect(52, 20, 22, 70, 4)} />
        <path className="faint dashed" d={`M12 ${target} L80 ${target}`} />
        <path
          className="accent thick"
          d={`M14 ${level.toFixed(1)} L78 ${level.toFixed(1)}`}
        />
        <text className="tl accent-text" x={84} y={(level + 2.5).toFixed(1)}>
          matched
        </text>
        <text className="tl" x={96} y={64}>
          reward
        </text>
        <path className="faint" d={penLine(96, 92, 154, 92, 8)} />
        <polyline className="accent" points={reward} />
      </>
    );
  },
};

// ---- AACD compiler: words become a tree, the tree lights a mat ----
const compiler: Drawing = {
  duration: 5200,
  label:
    'Words in a small language are parsed into a tree, and the tree lights squares on a sensory mat.',
  draw: (t) => {
    const words = ['repeat 3', 'jump', 'light'];
    const toTree = ease(phase(t, 0.15, 0.4));
    const mat = phase(t, 0.5, 0.95);
    const order = [0, 4, 8, 2, 6];
    return (
      <>
        {words.map((w, i) => (
          <g key={w} opacity={1 - toTree * 0.25}>
            <path
              className="pen"
              d={penRect(6, 16 + i * 24, 40, 14, i + 70, 0.5)}
            />
            <text className="tl" x={26} y={26 + i * 24} textAnchor="middle">
              {w}
            </text>
          </g>
        ))}
        <g opacity={toTree}>
          <path
            className="pen"
            d={`M78 24 L66 54 M78 24 L90 54 M90 54 L82 80 M90 54 L98 80`}
          />
          {[
            [78, 24],
            [66, 54],
            [90, 54],
            [82, 80],
            [98, 80],
          ].map(([x, y], i) => (
            <circle key={i} className="pen fill-paper" cx={x} cy={y} r={4} />
          ))}
        </g>
        {Array.from({ length: 9 }, (_, i) => {
          const x = 112 + (i % 3) * 14;
          const y = 32 + Math.floor(i / 3) * 14;
          const k = order.indexOf(i);
          const lit = k >= 0 ? phase(mat, k / 5, (k + 0.6) / 5) : 0;
          return (
            <g key={i}>
              <path className="pen" d={penRect(x, y, 12, 12, i + 80, 0.4)} />
              <rect
                className="fill-accent"
                x={x + 1}
                y={y + 1}
                width={10}
                height={10}
                opacity={lit * 0.8}
              />
            </g>
          );
        })}
      </>
    );
  },
};

// ---- FlightWise: a route found through a graph, around radar cover ----
const radars: [number, number, number][] = [
  [58, 40, 22],
  [114, 64, 17],
];
const route: [number, number][] = [
  [12, 86],
  [31.4, 68],
  [50.8, 68],
  [70.2, 68],
  [89.6, 50],
  [109, 32],
  [128.4, 32],
  [147.8, 14],
];
function along(points: [number, number][], p: number): [number, number] {
  const lens = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let d = clamp(p) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const f = d / lens[i];
      return [
        lerp(points[i][0], points[i + 1][0], f),
        lerp(points[i][1], points[i + 1][1], f),
      ];
    }
    d -= lens[i];
  }
  return points[points.length - 1];
}
const flight: Drawing = {
  duration: 4800,
  label:
    'Seen from above: hills drawn as contour lines, a grid of possible waypoints, two radar ranges, and a route found from start to end that passes around both.',
  draw: (t) => {
    const p = easeInOut(phase(t, 0.12, 0.92));
    const [hx, hy] = along(route, p);
    const sweep = t * Math.PI * 4;
    return (
      <>
        {Array.from({ length: 40 }, (_, k) => (
          <circle
            key={k}
            className="fill-ink"
            cx={12 + (k % 8) * 19.4}
            cy={14 + Math.floor(k / 8) * 18}
            r={0.9}
            opacity={0.35}
          />
        ))}
        <ellipse className="faint" cx={26} cy={30} rx={16} ry={11} />
        <ellipse className="faint" cx={27} cy={30} rx={8} ry={5} />
        <ellipse className="faint" cx={146} cy={82} rx={11} ry={9} />
        <ellipse className="faint" cx={147} cy={83} rx={5} ry={4} />
        <ellipse className="faint" cx={84} cy={90} rx={14} ry={7} />
        {radars.map(([x, y, r], i) => (
          <g key={i}>
            <circle className="hatch" cx={x} cy={y} r={r} />
            <circle className="faint dashed" cx={x} cy={y} r={r} />
            <path
              className="faint"
              d={`M${x} ${y} L${(x + Math.cos(sweep + i * 2) * r).toFixed(1)} ${(y + Math.sin(sweep + i * 2) * r).toFixed(1)}`}
            />
            <circle className="fill-ink" cx={x} cy={y} r={1.6} />
            <text className="tl" x={x} y={y + 10} textAnchor="middle">
              radar
            </text>
          </g>
        ))}
        <path
          className="accent"
          {...draw(p)}
          d={`M${route.map(([x, y]) => `${x} ${y}`).join(' L')}`}
        />
        <circle
          className="pen fill-paper"
          cx={route[0][0]}
          cy={route[0][1]}
          r={3}
        />
        <circle
          className="pen fill-paper"
          cx={route[route.length - 1][0]}
          cy={route[route.length - 1][1]}
          r={3}
        />
        <circle className="fill-accent" cx={hx} cy={hy} r={2.6} />
      </>
    );
  },
};

// ---- Klabin: the same orders, repacked so less paper is wasted ----
const ROLL = { x: 12, w: 136, h: 16, ys: [14, 38, 62] };
const paper: Drawing = {
  duration: 4800,
  label:
    'Six orders are cut from three paper rolls with large offcuts; rearranged, the same orders fit on two rolls with almost no waste.',
  draw: (t) => {
    const f = easeInOut(phase(t, 0.25, 0.75));
    const saved = phase(t, 0.78, 0.92);
    const fixed: [number, number, number][] = [
      [0, 0, 50],
      [0, 50, 40],
      [1, 0, 60],
      [1, 60, 30],
    ];
    // Two orders move up from the third roll into the gaps.
    const moving: [number, number, number, number, number][] = [
      [0, 2, 90, 0, 44],
      [44, 2, 90, 1, 42],
    ];
    const piece = (
      x: number,
      y: number,
      w: number,
      cls: string,
      key: string,
    ) => (
      <g key={key}>
        <rect className="fill-paper" x={x} y={y} width={w} height={ROLL.h} />
        <path
          className={cls}
          d={penRect(x, y, w, ROLL.h, Math.round(w + y), 0.4)}
        />
      </g>
    );
    return (
      <>
        {ROLL.ys.map((y, r) => (
          <g key={r} opacity={r === 2 ? 1 - f * 0.65 : 1}>
            <rect
              className="hatch"
              x={ROLL.x}
              y={y}
              width={ROLL.w}
              height={ROLL.h}
            />
            <path
              className={r === 2 && f > 0.5 ? 'faint dashed' : 'faint'}
              d={penRect(ROLL.x, y, ROLL.w, ROLL.h, r + 90, 0.4)}
            />
          </g>
        ))}
        {fixed.map(([r, x, w]) =>
          piece(ROLL.x + x, ROLL.ys[r], w, 'pen', `f${r}${x}`),
        )}
        {moving.map(([x0, r0, x1, r1, w]) =>
          piece(
            ROLL.x + lerp(x0, x1, f),
            lerp(ROLL.ys[r0], ROLL.ys[r1], f),
            w,
            'accent',
            `m${x0}`,
          ),
        )}
        <text
          className="tl"
          x={ROLL.x + ROLL.w / 2}
          y={73}
          textAnchor="middle"
          opacity={saved}
        >
          one roll fewer
        </text>
        <text className="tl" x={12} y={94}>
          waste
        </text>
        <text className="tl accent-text" x={148} y={94} textAnchor="end">
          {Math.round(lerp(35, 2, f))}%
        </text>
      </>
    );
  },
};

// ---- Stone: a traffic spike, servers added to absorb it ----
const spike: Drawing = {
  duration: 4800,
  label:
    'Traffic spikes when a TV ad airs, and servers are added to absorb it, then removed.',
  draw: (t) => {
    const load = (x: number) =>
      0.15 + 0.8 * Math.exp(-Math.pow((x - 0.45) / 0.12, 2));
    const cursor = phase(t, 0, 0.95);
    const pts = Array.from(
      { length: Math.max(2, Math.round(cursor * 40)) },
      (_, i) => {
        const x = i / 40;
        return `${(10 + x * 96).toFixed(1)},${(84 - load(x) * 60).toFixed(1)}`;
      },
    ).join(' ');
    const servers = 1 + Math.round(load(cursor) * 4);
    return (
      <>
        <path className="faint" d={penLine(10, 84, 106, 84, 3)} />
        <polyline className="pen" points={pts} />
        <text className="tl" x={44} y={14}>
          tv ad
        </text>
        <path className="faint dashed" d="M53 18 L53 82" />
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} opacity={i < servers ? 1 : 0.12}>
            <path
              className={i === 0 ? 'pen' : 'accent'}
              d={penRect(120, 72 - i * 15, 28, 11, i + 100, 0.4)}
            />
            <circle
              className={i === 0 ? 'fill-ink' : 'fill-accent'}
              cx={126}
              cy={77.5 - i * 15}
              r={1.4}
            />
          </g>
        ))}
      </>
    );
  },
};

// ---- A de Agro: outlining a field from above ----
const fieldOutline: [number, number][] = [
  [52, 26],
  [104, 20],
  [122, 52],
  [96, 80],
  [48, 72],
  [38, 46],
];
const field: Drawing = {
  duration: 4400,
  label:
    'Seen from above, the edge of a cultivated field is traced and its area filled in.',
  draw: (t) => {
    const trace = phase(t, 0.1, 0.7);
    const fill = phase(t, 0.7, 0.9);
    return (
      <>
        <path
          className="faint"
          d={penPoly(
            [
              [8, 8],
              [40, 6],
              [36, 40],
              [6, 44],
            ],
            1,
          )}
        />
        <path
          className="faint"
          d={penPoly(
            [
              [124, 6],
              [154, 10],
              [150, 46],
              [126, 40],
            ],
            2,
          )}
        />
        <path
          className="faint"
          d={penPoly(
            [
              [8, 56],
              [32, 62],
              [30, 94],
              [6, 92],
            ],
            3,
          )}
        />
        <path
          className="faint"
          d={penPoly(
            [
              [130, 60],
              [154, 58],
              [152, 94],
              [104, 94],
            ],
            4,
          )}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <path
            key={i}
            className="faint"
            d={`M${50 + i * 12} ${30 + i * 2} L${44 + i * 12} ${70 + i}`}
          />
        ))}
        <path
          className="fill-accent"
          d={penPoly(fieldOutline, 7, 0.6)}
          opacity={0.2 * fill}
        />
        <path
          className="accent thick"
          {...draw(trace)}
          d={penPoly(fieldOutline, 7, 0.6)}
        />
      </>
    );
  },
};

// ---- Brastel: question → intent → retrieved answer ----
const chatbot: Drawing = {
  duration: 4800,
  label:
    'A support question is sorted into an intent, a matching document is retrieved, and an answer is written.',
  draw: (t) => {
    const route = phase(t, 0.15, 0.35);
    const pick = phase(t, 0.35, 0.45);
    const doc = ease(phase(t, 0.5, 0.7));
    const answer = phase(t, 0.75, 0.95);
    return (
      <>
        <path className="pen" d="M8 18 h44 v18 h-34 l-6 6 v-6 h-4 z" />
        <path className="pen" d="M16 25 h28 M16 30 h18" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path
              className="faint"
              {...draw(route)}
              d={`M52 30 L72 ${22 + i * 22}`}
            />
            <circle
              className={i === 1 && pick > 0.5 ? 'accent' : 'pen'}
              cx={76}
              cy={22 + i * 22}
              r={4}
            />
            {i === 1 && (
              <circle
                className="fill-accent"
                cx={76}
                cy={44}
                r={2.2}
                opacity={pick}
              />
            )}
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            className="pen fill-paper"
            d={penRect(104 + i * 3, 18 + i * 3, 22, 28, i + 110, 0.4)}
          />
        ))}
        <g
          transform={`translate(${lerp(0, -18, doc)} ${lerp(0, 20, doc)})`}
          opacity={doc > 0 ? 1 : 0}
        >
          <path
            className="accent fill-paper"
            d={penRect(110, 24, 22, 28, 120, 0.4)}
          />
          <path className="accent" d="M114 32 h14 M114 37 h10 M114 42 h12" />
        </g>
        <g opacity={answer}>
          <path className="accent" d="M152 72 h-50 v18 h40 l6 6 v-6 h4 z" />
          <path className="accent" d="M110 79 h32 M110 84 h20" />
        </g>
      </>
    );
  },
};

// ---- Gerdau: sensor readings in a greenhouse ----
const greenhouse: Drawing = {
  duration: 4600,
  label:
    'A sensor inside a greenhouse sends temperature and humidity readings that draw two lines.',
  draw: (t) => {
    const blink = (Math.sin(t * Math.PI * 10) + 1) / 2;
    const n = Math.max(2, Math.round(phase(t, 0.1, 0.95) * 24));
    const line = (fn: (i: number) => number) =>
      Array.from(
        { length: n },
        (_, i) => `${(92 + i * 2.6).toFixed(1)},${fn(i).toFixed(1)}`,
      ).join(' ');
    return (
      <>
        <path className="pen" d="M10 86 L10 46 Q40 10 70 46 L70 86 Z" />
        <path
          className="faint"
          d="M10 46 L70 46 M40 22 L40 86 M24 30 L24 86 M56 30 L56 86"
        />
        <path
          className="pen"
          d="M22 86 q4 -14 0 -20 M30 86 q-4 -10 2 -16 M50 86 q4 -12 -2 -18"
        />
        <circle className="pen fill-paper" cx={40} cy={60} r={4} />
        <circle className="fill-accent" cx={40} cy={60} r={1.6 + blink * 1.4} />
        <path className="faint dashed" d="M44 58 Q66 40 88 44" />
        <text className="tl" x={92} y={18}>
          temp
        </text>
        <polyline
          className="accent"
          points={line((i) => 34 - Math.sin(i * 0.5) * 6 - i * 0.2)}
        />
        <text className="tl" x={92} y={58}>
          humidity
        </text>
        <polyline
          className="pen"
          points={line((i) => 78 + Math.sin(i * 0.5 + 1.4) * 6)}
        />
      </>
    );
  },
};

// ---- Falconi: a questionnaire that draws a school's strengths and gaps ----
const radar: Drawing = {
  duration: 4800,
  label:
    'Five questions are answered on a form, and each answer pushes out one corner of a chart showing a school’s strengths and gaps.',
  draw: (t) => {
    const cx = 114;
    const cy = 54;
    const R = 34;
    const values = [0.85, 0.55, 0.7, 0.35, 0.75];
    const answered = values.map((_, i) =>
      phase(t, 0.06 + i * 0.14, 0.16 + i * 0.14),
    );
    const at = (i: number, r: number): [number, number] => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    const ring = (r: number) =>
      penPoly(
        values.map((_, i) => at(i, r)),
        Math.round(r),
        0.4,
      );
    const shape = penPoly(
      values.map((v, i) => at(i, R * (0.08 + (v - 0.08) * ease(answered[i])))),
      3,
      0.3,
    );
    return (
      <>
        <path className="pen" d={penRect(8, 12, 54, 76, 4, 0.5)} />
        {values.map((_, i) => {
          const y = 24 + i * 13;
          return (
            <g key={i}>
              <path
                className={answered[i] >= 1 ? 'accent' : 'pen'}
                d={penRect(14, y - 4, 7, 7, i + 30, 0.3)}
              />
              <path
                className="accent"
                {...draw(answered[i])}
                d={`M15.5 ${y - 0.5} l2 2.2 l3.2 -4.4`}
              />
              <path className="faint" d={`M26 ${y - 2} h28 M26 ${y + 2} h18`} />
            </g>
          );
        })}
        <path className="faint" d="M65 54 h9 m-3 -3 l3 3 l-3 3" />
        <path className="faint" d={ring(R)} />
        <path className="faint" d={ring(R * 0.55)} />
        {values.map((_, i) => {
          const [x, y] = at(i, R);
          return (
            <path
              key={i}
              className="faint"
              d={`M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}`}
            />
          );
        })}
        <path className="fill-accent" d={shape} opacity={0.2} />
        <path className="accent" d={shape} />
        {values.map((v, i) => {
          const [x, y] = at(i, R * (0.08 + (v - 0.08) * ease(answered[i])));
          return answered[i] > 0 ? (
            <circle key={i} className="fill-accent" cx={x} cy={y} r={1.8} />
          ) : null;
        })}
      </>
    );
  },
};

// ---- TV Gazeta: a forecast for each time slot, then the real audience ----
const slotHeight = (i: number) =>
  8 +
  46 * Math.exp(-Math.pow((i - 10) / 1.8, 2)) +
  18 * Math.exp(-Math.pow((i - 6) / 1.2, 2));
const forecast: Drawing = {
  duration: 5200,
  label:
    'One bar per time slot through the day: the forecast audience is drawn first as outlines, peaking in the evening, then the real audience fills in close to it.',
  draw: (t) => (
    <>
      <path className="faint" d={penLine(12, 84, 152, 84, 3)} />
      <path className="pen" d={penRect(14, 8, 8, 6, 2, 0.2)} />
      <text className="tl" x={26} y={14}>
        forecast
      </text>
      <rect
        className="fill-accent"
        x={66}
        y={8}
        width={5}
        height={6}
        opacity={0.8}
      />
      <text className="tl" x={75} y={14}>
        actual
      </text>
      {Array.from({ length: 12 }, (_, i) => {
        const x = 15 + i * 11.4;
        const h = slotHeight(i) * ease(phase(t, i * 0.03, i * 0.03 + 0.14));
        const real =
          slotHeight(i) *
          (1 + Math.sin(i * 2.1) * 0.13) *
          ease(phase(t, 0.5 + i * 0.03, 0.62 + i * 0.03));
        return (
          <g key={i}>
            <rect
              className="fill-accent"
              x={x + 1.75}
              y={84 - real}
              width={4.5}
              height={real}
              opacity={0.8}
            />
            {h > 0.5 && (
              <path
                className="pen"
                d={`M${x} 84 V${(84 - h).toFixed(1)} h8 V84`}
              />
            )}
          </g>
        );
      })}
      {[
        [3, '6h'],
        [6, '12h'],
        [9, '18h'],
      ].map(([i, label]) => (
        <text
          key={label}
          className="tl"
          x={15 + Number(i) * 11.4 - 1.7}
          y={94}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </>
  ),
};

// ---- New York doodles (field notes): street steam, rain ----
const steam: Drawing = {
  duration: 3200,
  label:
    'Steam rising from a striped orange-and-white stack in the middle of a street.',
  draw: (t) => (
    <>
      <path className="faint" d={penLine(8, 90, 152, 91, 3)} />
      {[0, 1, 2, 3].map((i) => {
        // Each puff rises, drifts right with the wind, grows and fades.
        const p = (t + i / 4) % 1;
        return (
          <circle
            key={i}
            className="pen"
            cx={80 + p * 34 + Math.sin(p * 6 + i) * 3}
            cy={44 - p * 38}
            r={4 + p * 11}
            opacity={(1 - p) * 0.9}
          />
        );
      })}
      <path className="pen fill-paper" d={penRect(70, 46, 20, 44, 5, 0.4)} />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          className="accent thick"
          d={`M70 ${56 + i * 10} L90 ${50 + i * 10}`}
        />
      ))}
      <path className="pen" d="M112 90 L118 72 L124 90 Z M114 84 h8" />
      <path className="pen" d="M30 90 v-26 h22 v26 M30 72 h22" />
    </>
  ),
};

const rain: Drawing = {
  duration: 2600,
  label: 'A small cloud raining, with rings spreading where the drops land.',
  draw: (t) => (
    <>
      <path className="faint" d={penLine(20, 88, 140, 89, 3)} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        // Each drop falls on its own beat; a ring spreads where it lands.
        const p = (t + ((i * 5) % 6) / 6) % 1;
        const x = 50 + i * 12;
        const fall = Math.min(1, p / 0.7);
        const ring = p > 0.7 ? (p - 0.7) / 0.3 : 0;
        return (
          <g key={i}>
            {p <= 0.7 && (
              <path
                className="accent"
                d={`M${x} ${44 + fall * 36} l-2 7`}
                opacity={0.35 + fall * 0.65}
              />
            )}
            {ring > 0 && (
              <ellipse
                className="accent"
                cx={x - 2}
                cy={88}
                rx={2 + ring * 9}
                ry={0.8 + ring * 2.4}
                opacity={1 - ring}
              />
            )}
          </g>
        );
      })}
      <path
        className="pen fill-paper"
        d="M46 40 C32 40 30 24 43 22 C44 9 62 6 69 16 C77 5 97 7 101 20 C114 17 122 31 112 38 C110 41 106 40 104 40 Z"
      />
    </>
  ),
};

// ---- The steam doodle again, in cut paper wrapped in scanned textures ----
const disc = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)} a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 Z`;
const steamPaper: Drawing = {
  duration: 3600,
  label:
    'Steam rising from a striped orange-and-white stack in the middle of a street, made of cut paper.',
  draw: (t) => (
    <TexContext.Provider value="steam">
      <defs>
        <Surfaces uid="steam" />
      </defs>
      {/* The road */}
      <Cut
        drop
        d={penRect(8, 86, 144, 7, 3, 0.8)}
        fill="#8d9296"
        surface="kraft"
      />
      {/* A barrier and a cone */}
      <Cut
        drop
        d={penRect(28, 64, 26, 23, 5, 0.7)}
        fill="#e9dcc3"
        surface="crumple"
      />
      <Cut drop d="M28 71 h26 v5 h-26 Z" fill="#e8843a" turn={1} />
      <Cut drop d="M110 87 L117 68 L124 87 Z" fill="#e8843a" turn={2} />
      <Cut drop d="M113.3 78 h7.4 l1.5 4 h-10.4 Z" fill="#fffdf6" />
      {/* Puffs of crumpled paper: each rises, drifts, grows and fades */}
      {[0, 1, 2, 3].map((i) => {
        const p = (t + i / 4) % 1;
        return (
          <g key={i} opacity={Math.min(1, (1 - p) * 1.5)}>
            <Cut
              drop
              d={disc(
                80 + p * 34 + Math.sin(p * 6 + i) * 3,
                42 - p * 36,
                5 + p * 10,
              )}
              fill="#fffdf6"
              surface="crumple"
              turn={i}
            />
          </g>
        );
      })}
      {/* The stack, with its orange stripes */}
      <Cut drop d={penRect(70, 44, 20, 43, 7, 0.6)} fill="#fffdf6" />
      {[0, 1, 2, 3].map((i) => (
        <Cut
          key={i}
          drop
          d={`M70 ${55 + i * 10} L90 ${49 + i * 10} V${54 + i * 10} L70 ${60 + i * 10} Z`}
          fill="#e8843a"
          turn={i}
        />
      ))}
    </TexContext.Provider>
  ),
};

// ---- The rain doodle in cut paper ----
const oval = (x: number, y: number, rx: number, ry: number) =>
  `M${(x - rx).toFixed(1)} ${y.toFixed(1)} a${rx.toFixed(1)} ${ry.toFixed(1)} 0 1 0 ${(2 * rx).toFixed(1)} 0 a${rx.toFixed(1)} ${ry.toFixed(1)} 0 1 0 ${(-2 * rx).toFixed(1)} 0 Z`;
const CLOUD_BACK =
  'M70 36 C60 36 58 24 68 22 C70 12 84 10 90 18 C98 10 114 13 116 24 C126 23 130 34 122 38 Z';
const CLOUD_FRONT =
  'M46 42 C32 42 30 26 43 24 C44 11 62 8 69 18 C77 7 97 9 101 22 C114 19 122 33 112 40 C110 43 106 42 104 42 Z';
const rainPaper: Drawing = {
  duration: 2800,
  label:
    'A paper cloud raining slivers of blue paper, with rings spreading where they land on the road.',
  draw: (t) => (
    <TexContext.Provider value="rain">
      <defs>
        <Surfaces uid="rain" />
      </defs>
      {/* The road */}
      <Cut
        drop
        d={penRect(18, 86, 124, 7, 3, 0.8)}
        fill="#8d9296"
        surface="kraft"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        // Each drop falls on its own beat; a ring spreads where it lands.
        const p = (t + ((i * 5) % 6) / 6) % 1;
        const x = 50 + i * 12;
        const fall = Math.min(1, p / 0.7);
        const ring = p > 0.7 ? (p - 0.7) / 0.3 : 0;
        const y = 46 + fall * 34;
        return (
          <g key={i}>
            {p <= 0.7 && (
              <Cut
                drop
                d={`M${x} ${y.toFixed(1)} l-2.2 7.5 l2.4 0.7 l2.2 -7.5 Z`}
                fill={i % 2 ? '#3d7fae' : '#5f9cc0'}
                turn={i}
              />
            )}
            {ring > 0 && (
              <g opacity={1 - ring}>
                <Cut
                  drop
                  evenodd
                  d={`${oval(x - 2, 88, 3 + ring * 9, 1.2 + ring * 2.2)} ${oval(x - 2, 88, 1.4 + ring * 7.5, 0.5 + ring * 1.5)}`}
                  fill="#d3e8f3"
                />
              </g>
            )}
          </g>
        );
      })}
      {/* Two clouds of crumpled paper, one behind the other */}
      <Cut drop d={CLOUD_BACK} fill="#aeb9c2" surface="crumple" turn={1} />
      <Cut drop d={CLOUD_FRONT} fill="#f1f2f1" surface="crumple" />
    </TexContext.Provider>
  ),
};

export const DRAWINGS = {
  rainPaper,
  steamPaper,
  steam,
  rain,
  allocation,
  invoice,
  signature,
  tca,
  cluster,
  replay,
  nutrition,
  rl,
  compiler,
  flight,
  paper,
  spike,
  field,
  chatbot,
  greenhouse,
  radar,
  forecast,
} satisfies Record<string, Drawing>;

export type DrawingKey = keyof typeof DRAWINGS;
