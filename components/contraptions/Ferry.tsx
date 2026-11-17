'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useInView, usePrefersReducedMotion } from '@/lib/hooks';
import { clamp, easeInOut, lerp, penLine, penRect } from '@/lib/pen';
import { pluck } from '@/lib/contraptions/sound';
import { PaperBack, PaperBoat, PaperFront } from './FerryPaper';

// The East River from the Brooklyn side, looking west at Lower Manhattan.
//
// The ferry sails slowly across on its own. As it goes, afternoon turns to
// night: the sun sets behind the buildings, the sky turns to night with stars, and the
// windows light up. It sails off the right edge, a new day begins while it is
// out of sight, and it comes back in from the left. Dragging takes over, and
// on letting go it sails on from there. The loop keeps its place in time
// while the drawing is off screen, without drawing anything.

const W = 640;
const H = 280;
const HORIZON = 168;
const RIVER_Y = 214;

/** One full loop, including the stretch out of sight. */
const CYCLE_SECONDS = 84;
/** After a tap or a key press, a short beat before it sails on by itself. */
const IDLE_MS = 900;

// The loop is a phase p from 0 to 1 along a track wider than the drawing.
const OUT = 80; // how far past each edge the track runs
const xOf = (p: number) => lerp(-OUT, W + OUT, p);
const pAt = (x: number) => (x + OUT) / (W + 2 * OUT);
const P_DAY = pAt(70); // afternoon, where the drawing starts
const P_NIGHT = pAt(560); // full night
const P_GONE = pAt(W + 28); // just out of sight on the right
const P_BACK = pAt(-28); // just about to appear on the left
const P_MIN = pAt(12); // as far as it can be dragged
const P_MAX = pAt(W - 12);

/** Day (0) to night (1) for a phase, and whether a new day is dawning. */
function timeOfDay(p: number) {
  if (p >= P_GONE || p < P_BACK) {
    const r =
      (p >= P_GONE ? p - P_GONE : p + 1 - P_GONE) / (1 - P_GONE + P_BACK);
    return { tod: 1 - easeInOut(r), dawn: true };
  }
  return { tod: clamp((p - P_DAY) / (P_NIGHT - P_DAY)), dawn: false };
}

// [x, width, height] — a loose Lower Manhattan, drawn left to right.
const BUILDINGS: [number, number, number][] = [
  [14, 26, 52],
  [42, 20, 78],
  [64, 32, 64],
  [98, 18, 108],
  [118, 36, 88],
  [156, 22, 70],
  [180, 30, 132], // tall, with a spire (One World Trade)
  [212, 34, 98],
  [248, 22, 76],
  [272, 38, 116],
  [312, 28, 84],
  [342, 20, 102],
  [364, 40, 66],
];

function rand(i: number) {
  const x = Math.sin(i * 91.7 + 13.1) * 43758.5453;
  return x - Math.floor(x);
}
const r1 = (v: number) => Math.round(v * 10) / 10;

const WINDOWS = BUILDINGS.flatMap(([x, w, h], b) => {
  const cols = Math.max(2, Math.floor((w - 6) / 8));
  const rows = Math.max(2, Math.floor((h - 10) / 12));
  const out: { x: number; y: number; on: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const k = b * 100 + r * 10 + c;
      if (rand(k) < 0.45) continue; // not every window
      out.push({
        x: r1(x + 4 + c * ((w - 8) / cols) + 1),
        y: HORIZON - h + 8 + r * 12,
        on: 0.45 + rand(k + 7) * 0.5, // when it switches on
      });
    }
  return out;
});

// Each star blinks at its own pace, so the sky never pulses in step.
const STARS = Array.from({ length: 38 }, (_, i) => ({
  x: r1(6 + rand(i + 300) * (W - 12)),
  y: r1(8 + rand(i + 340) * (HORIZON - 34)),
  r: r1(0.7 + rand(i + 380) * 0.9),
  dur: r1(1.6 + rand(i + 420) * 3.4),
  delay: r1(-rand(i + 460) * 5),
}));

const RIVER = [0, 1, 2, 3].map((i) =>
  penLine(
    10 + i * 7,
    RIVER_Y - 20 + i * 18,
    W - 20 - i * 9,
    RIVER_Y - 22 + i * 18,
    i + 40,
    1.4,
  ),
);

/** For screen readers, in place of a clock. */
const moment = (tod: number) =>
  tod < 0.35 ? 'afternoon' : tod < 0.75 ? 'sunset' : 'night';

type Props = {
  /**
   * 'pen' is the line drawing; 'paper' is the cut-paper theatre with a
   * generated grain; 'textured' wraps the paper pieces in scanned paper.
   */
  look?: 'pen' | 'paper' | 'textured';
};

export default function Ferry({ look = 'pen' }: Props) {
  const paper = look !== 'pen';
  const tex = look === 'textured';
  const scene = { W, H, HORIZON, RIVER_Y };
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewRef, inView] = useInView<HTMLDivElement>(0.5);
  const [p, setP] = useState(P_DAY); // where the ferry is drawn
  const [moving, setMoving] = useState(false);
  const [touched, setTouched] = useState(false);
  const target = useRef(P_DAY);
  const shown = useRef(P_DAY);
  const auto = useRef(false);
  const visible = useRef(false);
  const resumeAt = useRef(0);
  const running = useRef(false);
  const raf = useRef(0);
  const press = useRef<{ x: number; moved: boolean } | null>(null);
  const lastLit = useRef(0);
  const wasMoving = useRef(false);
  const pausedAt = useRef(0);

  // One loop while the drawing is on screen. Sailing alone, the phase just
  // advances and wraps. Steered, the ferry stays under the pointer while
  // dragging and glides after a tap or a key press.
  const start = () => {
    if (running.current || reduced) return;
    running.current = true;
    let last = performance.now();
    if (pausedAt.current) {
      // It kept sailing while out of sight (after any pause from steering).
      const since = Math.max(pausedAt.current, resumeAt.current);
      if (last > since) {
        shown.current =
          (shown.current + (last - since) / 1000 / CYCLE_SECONDS) % 1;
        target.current = shown.current;
        auto.current = true;
      }
      pausedAt.current = 0;
    }
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const before = shown.current;
      if (
        !auto.current &&
        !press.current &&
        visible.current &&
        now > resumeAt.current &&
        Math.abs(target.current - shown.current) < 0.003
      )
        auto.current = true;
      if (auto.current) {
        shown.current = (shown.current + dt / CYCLE_SECONDS) % 1;
        target.current = shown.current;
      } else {
        const rate = press.current?.moved ? 45 : 7;
        shown.current +=
          (target.current - shown.current) * (1 - Math.exp(-rate * dt));
      }
      const isMoving = Math.abs(shown.current - before) > 1e-6;
      if (isMoving !== wasMoving.current) {
        wasMoving.current = isMoving;
        setMoving(isMoving);
      }
      setP(shown.current);
      if (!visible.current && !press.current) {
        // Off screen: stop drawing, but remember when, so the loop can pick
        // up where it would have got to.
        running.current = false;
        auto.current = false;
        pausedAt.current = now;
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  /** Someone is steering: go where they point, and wait before sailing on. */
  const go = (to: number) => {
    auto.current = false;
    resumeAt.current = performance.now() + IDLE_MS;
    target.current = clamp(to, P_MIN, P_MAX);
    if (reduced) {
      shown.current = target.current;
      setP(shown.current);
    } else start();
  };

  // Sail whenever the drawing is on screen.
  useEffect(() => {
    visible.current = inView;
    if (inView) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      running.current = false;
    },
    [],
  );

  const { tod, dawn } = timeOfDay(p);

  // A soft note each time a few more windows switch on.
  useEffect(() => {
    const lit = WINDOWS.filter((w) => tod > w.on).length;
    if (lit - lastLit.current >= 6) {
      pluck(Math.floor(lit / 6));
      lastLit.current = lit;
    } else if (lit < lastLit.current) lastLit.current = lit;
  }, [tod]);

  /** Hands off: after a drag, it sails on from exactly where it was left. */
  const release = () => {
    const hold = press.current;
    press.current = null;
    if (!hold?.moved) return;
    target.current = shown.current;
    resumeAt.current = 0;
  };

  const sceneX = (e: React.PointerEvent) => {
    const m = svgRef.current?.getScreenCTM();
    return m
      ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).x
      : null;
  };

  const ferryX = xOf(p);
  const bob = moving ? Math.sin(ferryX / 9) * 1.4 : 0;
  const night = easeInOut(clamp((tod - 0.5) / 0.5));
  // A warm band on the horizon around sunset, gone by night.
  const glow = Math.max(0, 1 - Math.abs(tod - 0.62) / 0.3);
  const stars = clamp((night - 0.55) / 0.45);
  // Setting, the sun slides down behind the buildings. At dawn it simply
  // returns to where the afternoon begins.
  const sunX = dawn ? 150 : lerp(150, 236, tod);
  const sunY = dawn ? 62 : lerp(62, HORIZON + 26, Math.pow(tod, 1.15));
  const sunOpacity = dawn ? 1 - tod : 1;

  return (
    <div
      className={`ferry${paper ? ' is-paper' : ''}${tex ? ' is-textured' : ''}`}
      ref={viewRef}
    >
      <div className="ferry-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="ferry-svg"
          style={{ '--night': r1(night * 10) / 10 } as CSSProperties}
          role="group"
          aria-label="A drawing of the East River with a ferry crossing it. As the ferry crosses, afternoon turns to night: the sun sets behind Lower Manhattan, the sky turns to night with stars, and the windows light up."
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Capture is a nicety (keeps the drag when leaving the drawing).
            }
            press.current = { x: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            const hold = press.current;
            if (!hold) return;
            // The button was let go somewhere we didn't hear about.
            if (e.pointerType === 'mouse' && e.buttons === 0) return release();
            // A small threshold, so scrolling past on a phone doesn't move it.
            if (!hold.moved && Math.abs(e.clientX - hold.x) > 4) {
              hold.moved = true;
              setTouched(true);
            }
            const x = sceneX(e);
            if (hold.moved && x !== null) go(pAt(x));
          }}
          onPointerUp={(e) => {
            const hold = press.current;
            const x = sceneX(e);
            if (hold && !hold.moved && x !== null) {
              setTouched(true);
              go(pAt(x)); // a tap: glide there, then sail on
            }
            release();
          }}
          onPointerCancel={release}
          onLostPointerCapture={release}
        >
          {paper ? (
            <PaperBack
              scene={scene}
              uid={uid}
              tex={tex}
              p={p}
              glow={glow}
              sunX={sunX}
              sunY={sunY}
              sunOpacity={sunOpacity}
              buildings={BUILDINGS}
            />
          ) : (
            <>
              <defs>
                <clipPath id={`sky${uid}`}>
                  <rect x={0} y={0} width={W} height={HORIZON} />
                </clipPath>
                <linearGradient id={`glow${uid}`} x1="0" y1="1" x2="0" y2="0">
                  <stop
                    offset="0"
                    stopColor="var(--amber)"
                    stopOpacity="0.55"
                  />
                  <stop offset="0.7" stopColor="var(--amber)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Sky: sunset glow, then night with stars */}
              <rect
                className="ferry-night-sky"
                x={0}
                y={0}
                width={W}
                height={HORIZON}
                opacity={night}
              />
              <rect
                x={0}
                y={0}
                width={W}
                height={HORIZON}
                fill={`url(#glow${uid})`}
                opacity={r1(glow * 10) / 10}
              />
              <g opacity={stars} aria-hidden="true">
                {STARS.map((s, i) => (
                  <circle
                    key={i}
                    className="ferry-star"
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    style={{
                      animationDuration: `${s.dur}s`,
                      animationDelay: `${s.delay}s`,
                    }}
                  />
                ))}
              </g>

              {/* Sun: behind the buildings, and gone once it reaches the horizon */}
              <g clipPath={`url(#sky${uid})`} opacity={sunOpacity}>
                <circle
                  className="ferry-sun"
                  cx={r1(sunX)}
                  cy={r1(sunY)}
                  r={13}
                />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const a = (i / 6) * Math.PI * 2;
                  return (
                    <path
                      key={i}
                      className="ferry-ray"
                      opacity={1 - night}
                      d={`M${(sunX + Math.cos(a) * 18).toFixed(1)} ${(sunY + Math.sin(a) * 18).toFixed(1)} L${(sunX + Math.cos(a) * 24).toFixed(1)} ${(sunY + Math.sin(a) * 24).toFixed(1)}`}
                    />
                  );
                })}
              </g>

              {/* Skyline */}
              {BUILDINGS.map(([x, w, h], i) => (
                <g key={i}>
                  <rect
                    className="ferry-fill"
                    x={x}
                    y={HORIZON - h}
                    width={w}
                    height={h}
                  />
                  <path
                    className="ferry-pen"
                    d={penRect(x, HORIZON - h, w, h, i + 3, 0.6)}
                  />
                  {i === 6 && (
                    <path
                      className="ferry-pen"
                      d={`M${x + w / 2} ${HORIZON - h} L${x + w / 2} ${HORIZON - h - 22}`}
                    />
                  )}
                </g>
              ))}
              {WINDOWS.map((win, i) => (
                <rect
                  key={i}
                  className="ferry-window"
                  x={win.x}
                  y={win.y}
                  width={3}
                  height={4}
                  opacity={clamp((tod - win.on) / 0.05)}
                />
              ))}

              {/* Brooklyn Bridge, to the right */}
              <g className="ferry-pen">
                <path d={`M430 ${HORIZON - 6} L640 ${HORIZON - 26}`} />
                <path d={`M430 ${HORIZON - 2} L640 ${HORIZON - 22}`} />
                <path d={penRect(520, 52, 34, HORIZON - 52 - 14, 77, 0.5)} />
                <path d="M526 74 q5 -14 10 0 v26 M540 74 q5 -14 10 0 v26" />
                <path d={`M430 ${HORIZON - 8} Q480 ${HORIZON - 20} 520 60`} />
                <path d={`M554 60 Q600 ${HORIZON - 40} 640 ${HORIZON - 34}`} />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const x = 440 + i * 13;
                  return (
                    <path
                      key={i}
                      className="faint"
                      d={`M${x} ${(HORIZON - 7 - i * 0.9).toFixed(1)} L${x} ${HORIZON - 14 - i * 9}`}
                    />
                  );
                })}
              </g>

              {/* River */}
              <rect
                className="ferry-night-water"
                x={0}
                y={HORIZON}
                width={W}
                height={H - HORIZON}
                opacity={night}
              />
              <path
                className="ferry-pen"
                d={penLine(0, HORIZON, W, HORIZON + 1, 5, 1)}
              />
              {RIVER.map((d, i) => (
                <path key={i} className="ferry-water" d={d} />
              ))}
              {BUILDINGS.map(([x, w], i) => (
                <path
                  key={i}
                  className="ferry-reflect"
                  opacity={r1(night * 8) / 10}
                  d={`M${x + 4} ${HORIZON + 10 + (i % 3) * 6} h${w - 8}`}
                />
              ))}
              <path
                className="ferry-route"
                d={`M8 ${RIVER_Y + 15} H${W - 8}`}
              />

              {/* Wake */}
              {moving &&
                [1, 2, 3].map((k) => (
                  <path
                    key={k}
                    className="ferry-wake"
                    opacity={0.7 - k * 0.18}
                    d={`M${(ferryX - 30 - k * 12).toFixed(1)} ${RIVER_Y + 6 + k * 3} q6 -3 12 0`}
                  />
                ))}

              {/* Until someone tries it: arrows beside the boat */}
              {!touched && (
                <g
                  className="ferry-nudge"
                  aria-hidden="true"
                  transform={`translate(${ferryX.toFixed(1)} 0)`}
                >
                  <path d={`M38 ${RIVER_Y - 1} l6 5 l-6 5`} />
                  <path d={`M50 ${RIVER_Y - 1} l6 5 l-6 5`} />
                  <path d={`M62 ${RIVER_Y - 1} l6 5 l-6 5`} />
                </g>
              )}
            </>
          )}

          {/* Ferry */}
          <g
            className="ferry-boat"
            role="slider"
            tabIndex={0}
            aria-label="Ferry. Drag it, or use the arrow keys, to cross the river and move from afternoon to night."
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(tod * 100)}
            aria-valuetext={moment(tod)}
            transform={`translate(${ferryX.toFixed(1)} ${(RIVER_Y + bob).toFixed(1)})`}
            onKeyDown={(e) => {
              const d =
                e.key === 'ArrowRight' || e.key === 'ArrowUp'
                  ? 0.04
                  : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                    ? -0.04
                    : 0;
              if (!d) return;
              e.preventDefault();
              setTouched(true);
              go(clamp(target.current, P_MIN, P_MAX) + d);
            }}
          >
            <rect
              className="ferry-hit"
              x={-34}
              y={-30}
              width={68}
              height={44}
            />
            {paper ? (
              <PaperBoat
                rock={moving ? Math.sin(ferryX / 16) * 3 : 0}
                uid={uid}
                tex={tex}
              />
            ) : (
              <>
                <path className="ferry-hull" d="M-26 0 L26 0 L20 9 L-22 9 Z" />
                <path
                  className="ferry-pen ferry-cabin"
                  d="M-16 0 V-11 H14 V0 M-10 -11 V-16 H8 V-11"
                />
                {[-12, -5, 2, 9].map((x) => (
                  <rect
                    key={x}
                    className="ferry-porthole"
                    x={x}
                    y={-8}
                    width={4}
                    height={4}
                    opacity={r1(3.5 + night * 6.5) / 10}
                  />
                ))}
              </>
            )}
          </g>

          {paper && (
            <PaperFront
              scene={scene}
              uid={uid}
              tex={tex}
              p={p}
              tod={tod}
              night={night}
              stars={stars}
              ferryX={ferryX}
              bob={bob}
              touched={touched}
              buildings={BUILDINGS}
              windows={WINDOWS}
              starList={STARS}
            />
          )}
        </svg>
      </div>
      <p className="xp-hint">Drag the ferry; let go and it sails on.</p>
    </div>
  );
}
