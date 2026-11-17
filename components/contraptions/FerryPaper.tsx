'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { penRect } from '@/lib/pen';

// The ferry scene as a paper theatre: every object is a piece cut from
// coloured paper, stacked in layers, each casting a small hard shadow on the
// layer behind (lit from the front and below, like footlights). The boat is
// a folded paper boat sitting between two strips of waves. Night is the
// lights going down: one dark sheet over everything, with the windows, stars
// and the boat's lantern glowing through.
//
// With `tex`, each piece is also wrapped in a scanned paper surface: fine
// paper for the towers, creased paper for the sky, the water and the boat,
// kraft for the bridge. The scans are CC0, from ambientcg.com (Paper001,
// Paper003, Paper006), reduced to transparent tiles in public/textures.
//
// Drawn in two halves so the boat can sit between the wave strips:
// <PaperBack />, then the boat, then <PaperFront />.

const PAPER = {
  sky: '#cfe0e6',
  far: '#9fb3bf',
  near: ['#f3ead8', '#e9dcc3', '#f7f1e3', '#dfd2b8'],
  kraft: '#b58a5a',
  kraftDark: '#9a7446',
  thread: '#6f5334',
  sun: '#f0a43c',
  sunInner: '#f7c15e',
  cloud: '#fbf8f0',
  waves: ['#8fbcd4', '#5f9cc0', '#3d7fae'],
  boat: '#fffdf6',
  boatShade: '#ddd6c6',
  night: '#0b1238',
  glow: '#f4b24a',
  star: '#eef2ff',
};

type Scene = { W: number; H: number; HORIZON: number; RIVER_Y: number };
type Building = [number, number, number];

// ---- Scanned surfaces -------------------------------------------------------

/** [file, tile width, tile height] in drawing units. */
const SURFACES = {
  fine: ['paper-fine', 170, 100],
  creased: ['paper-creased', 250, 250],
  crumple: ['paper-creased', 96, 96], // the same sheet, folded smaller
  kraft: ['paper-kraft', 150, 150],
} as const;
type Surface = keyof typeof SURFACES;
const VARIANTS = 3; // the same sheet, turned and shifted, so pieces differ

/** The id prefix of this drawing's surfaces, or null for plain paper. */
export const TexContext = createContext<string | null>(null);

export function Surfaces({ uid }: { uid: string }) {
  return (
    <>
      {(Object.keys(SURFACES) as Surface[]).flatMap((name) => {
        const [file, w, h] = SURFACES[name];
        return Array.from({ length: VARIANTS }, (_, v) => (
          <pattern
            key={`${name}${v}`}
            id={`tx-${name}${v}-${uid}`}
            patternUnits="userSpaceOnUse"
            width={w}
            height={h}
            patternTransform={`rotate(${v * 90}) translate(${v * 37} ${v * 53})`}
          >
            <image href={`/textures/${file}.webp`} width={w} height={h} />
          </pattern>
        ));
      })}
    </>
  );
}

/** A cut piece of paper with its shadow on the layer behind. */
export function Cut({
  d,
  fill,
  surface = 'fine',
  turn = 0,
  evenodd = false,
  drop = false,
}: {
  d: string;
  fill: string;
  surface?: Surface;
  turn?: number;
  evenodd?: boolean;
  /** Shadow falls down and right (a piece lying on the page). */
  drop?: boolean;
}) {
  const tex = useContext(TexContext);
  const rule = evenodd ? 'evenodd' : undefined;
  const dy = drop ? 1 : -1;
  return (
    <>
      {tex && (
        <path
          d={d}
          transform={`translate(${drop ? 3 : 4} ${dy * (drop ? 3 : 4)})`}
          fill="#1c1b18"
          opacity={0.07}
          fillRule={rule}
        />
      )}
      <path
        d={d}
        transform={`translate(${drop ? 1.5 : 2} ${dy * (drop ? 1.5 : 2)})`}
        fill="#1c1b18"
        opacity={0.2}
        fillRule={rule}
      />
      <path d={d} fill={fill} fillRule={rule} />
      {tex && (
        <path
          d={d}
          fill={`url(#tx-${surface}${turn % VARIANTS}-${tex})`}
          fillRule={rule}
          // The lit edge of the sheet's thickness.
          stroke="#fff"
          strokeOpacity={0.35}
          strokeWidth={0.7}
        />
      )}
    </>
  );
}

/** A strip of paper with a scalloped top edge. */
function wave(
  y: number,
  amp: number,
  len: number,
  shift: number,
  { W, H }: Scene,
) {
  const start = -2 * len - (((shift % len) + len) % len);
  let d = `M${start.toFixed(1)} ${y}`;
  for (let x = start; x < W + len; x += len)
    d += ` q${len / 2} ${-amp} ${len} 0`;
  return `${d} V${H + 6} H${start.toFixed(1)} Z`;
}

const CLOUD =
  'M0 0 q2 -11 14 -8 q5 -11 18 -5 q11 -5 15 7 q9 1 6 10 H-3 q-7 -3 3 -4 Z';

// A second row of towers, further away.
const FAR: Building[] = [
  [2, 24, 70],
  [30, 26, 96],
  [60, 22, 60],
  [86, 30, 122],
  [122, 24, 84],
  [150, 28, 104],
  [198, 28, 76],
  [230, 30, 126],
  [266, 26, 92],
  [298, 34, 72],
  [336, 28, 112],
  [370, 30, 60],
  [398, 26, 42],
];

type BackProps = {
  scene: Scene;
  uid: string;
  /** Wrap the pieces in scanned paper. */
  tex: boolean;
  p: number;
  glow: number;
  sunX: number;
  sunY: number;
  sunOpacity: number;
  buildings: Building[];
};

export function PaperBack({
  scene,
  uid,
  tex,
  p,
  glow,
  sunX,
  sunY,
  sunOpacity,
  buildings,
}: BackProps) {
  const { W, H, HORIZON, RIVER_Y } = scene;
  return (
    <TexContext.Provider value={tex ? uid : null}>
      <defs>
        <linearGradient id={`pglow${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={PAPER.sun} stopOpacity="0.6" />
          <stop offset="0.75" stopColor={PAPER.sun} stopOpacity="0" />
        </linearGradient>
        {tex && <Surfaces uid={uid} />}
      </defs>

      {/* Sky sheet, and the warm light of sunset on it */}
      <rect x={0} y={0} width={W} height={H} fill={PAPER.sky} />
      {tex && (
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill={`url(#tx-creased0-${uid})`}
        />
      )}
      <rect
        x={0}
        y={0}
        width={W}
        height={HORIZON}
        fill={`url(#pglow${uid})`}
        opacity={Math.round(glow * 10) / 10}
      />

      {/* Sun: two discs of orange paper, sliding down behind the towers */}
      <g
        transform={`translate(${sunX.toFixed(1)} ${sunY.toFixed(1)})`}
        opacity={sunOpacity}
      >
        <Cut
          d="M-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z"
          fill={PAPER.sun}
        />
        <Cut
          d="M-8.5 0 a8.5 8.5 0 1 0 17 0 a8.5 8.5 0 1 0 -17 0 Z"
          fill={PAPER.sunInner}
          turn={1}
        />
      </g>

      {/* Clouds drift slowly */}
      <g transform={`translate(${(60 + p * 90).toFixed(1)} 44)`}>
        <Cut d={CLOUD} fill={PAPER.cloud} surface="crumple" />
      </g>
      <g transform={`translate(${(430 + p * 60).toFixed(1)} 30) scale(0.8)`}>
        <Cut d={CLOUD} fill={PAPER.cloud} surface="crumple" turn={1} />
      </g>

      {/* Far towers */}
      {FAR.map(([x, w, h], i) => (
        <Cut
          key={i}
          d={penRect(x, HORIZON - h, w, h + 6, i + 50, 1.1)}
          fill={PAPER.far}
          turn={i}
        />
      ))}

      {/* Brooklyn Bridge, cut from kraft paper, with thread for cables */}
      <g
        fill="none"
        stroke={PAPER.thread}
        strokeWidth={1.1}
        strokeLinecap="round"
      >
        <path d={`M430 ${HORIZON - 10} Q480 ${HORIZON - 22} 522 58`} />
        <path d={`M552 58 Q600 ${HORIZON - 42} 640 ${HORIZON - 36}`} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 440 + i * 13;
          return (
            <path
              key={i}
              opacity={0.7}
              d={`M${x} ${(HORIZON - 9 - i * 0.9).toFixed(1)} L${x} ${HORIZON - 16 - i * 9}`}
            />
          );
        })}
      </g>
      <Cut
        d={`M430 ${HORIZON - 9} L640 ${HORIZON - 29} V${HORIZON - 22} L430 ${HORIZON - 2} Z`}
        fill={PAPER.kraftDark}
        surface="kraft"
        turn={1}
      />
      <Cut
        evenodd
        d={`${penRect(520, 52, 34, HORIZON - 52 - 12, 77, 0.8)} M526 104 V78 q5 -14 10 0 V104 Z M540 104 V78 q5 -14 10 0 V104 Z`}
        fill={PAPER.kraft}
        surface="kraft"
      />

      {/* Near towers, in a few creams */}
      {buildings.map(([x, w, h], i) => (
        <g key={i}>
          {i === 6 && (
            <Cut
              d={`M${x + w / 2 - 1.5} ${HORIZON - h + 2} V${HORIZON - h - 22} h3 V${HORIZON - h + 2} Z`}
              fill={PAPER.near[0]}
            />
          )}
          <Cut
            d={penRect(x, HORIZON - h, w, h + 6, i + 3, 1)}
            fill={PAPER.near[i % PAPER.near.length]}
            surface={i % 3 === 1 ? 'crumple' : 'fine'}
            turn={i}
          />
        </g>
      ))}

      {/* The river: two strips of waves behind the boat */}
      <Cut
        d={wave(HORIZON + 2, 5, 36, p * 190, scene)}
        fill={PAPER.waves[0]}
        surface="creased"
        turn={1}
      />
      <Cut
        d={wave(RIVER_Y - 14, 6, 44, p * 380, scene)}
        fill={PAPER.waves[1]}
        surface="creased"
        turn={2}
      />
    </TexContext.Provider>
  );
}

/** A folded paper boat. Drawn around (0, 0) at the waterline. */
export function PaperBoat({
  rock,
  uid,
  tex,
}: {
  rock: number;
  uid: string;
  tex: boolean;
}) {
  const hull = 'M-30 -5 L30 -5 L19 12 L-19 12 Z';
  const sail = 'M-13 -5 L0 -26 L13 -5 Z';
  return (
    <TexContext.Provider value={tex ? uid : null}>
      <g transform={`rotate(${rock.toFixed(1)})`}>
        <Cut d={sail} fill={PAPER.boat} surface="crumple" />
        <path d="M0 -26 L13 -5 L0 -5 Z" fill="#1c1b18" opacity={0.13} />
        <Cut d={hull} fill={PAPER.boat} surface="crumple" turn={1} />
        <path d="M0 -5 L30 -5 L19 12 L0 12 Z" fill="#1c1b18" opacity={0.13} />
        {/* The folds */}
        <path
          d="M0 -26 V12 M-24 3 H24"
          fill="none"
          stroke="#1c1b18"
          strokeWidth={0.6}
          opacity={0.25}
        />
      </g>
    </TexContext.Provider>
  );
}

type FrontProps = {
  scene: Scene;
  uid: string;
  tex: boolean;
  p: number;
  tod: number;
  night: number;
  stars: number;
  ferryX: number;
  bob: number;
  touched: boolean;
  buildings: Building[];
  windows: { x: number; y: number; on: number }[];
  starList: { x: number; y: number; r: number; dur: number; delay: number }[];
};

export function PaperFront({
  scene,
  uid,
  tex,
  p,
  tod,
  night,
  stars,
  ferryX,
  bob,
  touched,
  buildings,
  windows,
  starList,
}: FrontProps) {
  const { W, H, HORIZON, RIVER_Y } = scene;
  const lit = (on: number) => Math.max(0, Math.min(1, (tod - on) / 0.05));
  let glows: ReactNode = null;
  glows = (
    <>
      <g opacity={stars} aria-hidden="true">
        {starList.map((s, i) => (
          <circle
            key={i}
            className="ferry-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={PAPER.star}
            style={{
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </g>
      {windows.map((win, i) => (
        <rect
          key={i}
          x={win.x}
          y={win.y}
          width={3}
          height={4}
          fill={PAPER.glow}
          opacity={lit(win.on)}
        />
      ))}
      {buildings.map(([x, w], i) => (
        <path
          key={i}
          d={`M${x + 4} ${HORIZON + 12 + (i % 3) * 6} h${w - 8}`}
          fill="none"
          stroke={PAPER.glow}
          strokeWidth={1.8}
          strokeDasharray="2 5"
          strokeLinecap="round"
          opacity={Math.round(night * 7) / 10}
        />
      ))}
      <circle
        cx={ferryX.toFixed(1)}
        cy={(RIVER_Y + bob - 9).toFixed(1)}
        r={2.4}
        fill={PAPER.glow}
        opacity={night}
      />
    </>
  );
  return (
    <TexContext.Provider value={tex ? uid : null}>
      {/* The strip of waves in front of the boat */}
      <Cut
        d={wave(RIVER_Y + 4, 7, 52, p * 640, scene)}
        fill={PAPER.waves[2]}
        surface="creased"
      />

      {/* Night: the lights go down over everything */}
      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        fill={PAPER.night}
        opacity={Math.round(night * 80) / 100}
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* What glows in the dark */}
      {glows}

      {/* Until someone tries it: arrows beside the boat */}
      {!touched && (
        <g
          className="ferry-nudge is-paper"
          aria-hidden="true"
          transform={`translate(${ferryX.toFixed(1)} 0)`}
        >
          <path d={`M42 ${RIVER_Y - 8} l6 5 l-6 5`} />
          <path d={`M54 ${RIVER_Y - 8} l6 5 l-6 5`} />
          <path d={`M66 ${RIVER_Y - 8} l6 5 l-6 5`} />
        </g>
      )}
    </TexContext.Provider>
  );
}
