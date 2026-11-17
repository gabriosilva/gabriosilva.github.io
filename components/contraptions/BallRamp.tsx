'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BALL_R,
  BLOCK,
  GROUND,
  LIP,
  RAMP_FOOT,
  RAMP_TOP,
  SCENE,
  START_MAX,
  START_MIN,
  rampPoint,
  sampleAt,
  simulate,
  type Run,
} from '@/lib/contraptions/ball-ramp-model';
import { penLine, penRect } from '@/lib/pen';
import { thud } from '@/lib/contraptions/sound';
import { usePrefersReducedMotion } from '@/lib/hooks';

type Props = { start?: number; block?: number; compact?: boolean };

const VERDICT: Record<Run['outcome'], string> = {
  clears: 'it clears it.',
  hits: 'not quite. it hits the block.',
  short: 'it never reaches it in the air.',
};

export default function BallRamp({
  start = 0.5,
  block = 440,
  compact = false,
}: Props) {
  const [s, setS] = useState(start);
  const [bx, setBx] = useState(block);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const raf = useRef(0);
  const drag = useRef<'ball' | 'block' | null>(null);

  const rest = rampPoint(s);

  const placeBall = (x: number, y: number, rot = 0) => {
    ballRef.current?.setAttribute(
      'transform',
      `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)})`,
    );
  };

  // Keep the ball on the ramp while idle.
  useEffect(() => {
    if (status === 'idle') placeBall(rest.x, rest.y);
  }, [rest.x, rest.y, status]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const release = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const run = simulate(s, bx);
    setLastRun(null);
    setStatus('running');
    const end = run.samples[run.samples.length - 1];
    if (reduced) {
      placeBall(end.x, end.y);
      setLastRun(run);
      setStatus('done');
      return;
    }
    let t0 = 0;
    let landed = false;
    let hit = false;
    const x0 = run.samples[0].x;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const p = sampleAt(run, t);
      // Rolling: rotation follows distance travelled.
      placeBall(p.x, p.y, ((p.x - x0) / BALL_R) * (180 / Math.PI));
      if (!landed && run.landAt !== null && t >= run.landAt) {
        landed = true;
        thud(0.8);
      }
      if (!hit && run.hitAt !== null && t >= run.hitAt) {
        hit = true;
        thud(1);
      }
      if (t < end.t) raf.current = requestAnimationFrame(tick);
      else {
        setLastRun(run);
        setStatus('done');
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, [s, bx, reduced]);

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setLastRun(null);
    setStatus('idle');
    setS(start);
    setBx(block);
  };

  const toScene = (e: React.PointerEvent) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toScene(e);
    if (!p) return;
    if (drag.current === 'ball') {
      const dx = RAMP_FOOT.x - RAMP_TOP.x;
      const dy = RAMP_FOOT.y - RAMP_TOP.y;
      const proj =
        ((p.x - RAMP_TOP.x) * dx + (p.y - RAMP_TOP.y) * dy) /
        (dx * dx + dy * dy);
      setS(Math.max(START_MIN, Math.min(START_MAX, proj)));
    } else {
      setBx(Math.max(BLOCK.min, Math.min(BLOCK.max, p.x - BLOCK.w / 2)));
    }
  };

  const grab = (what: 'ball' | 'block') => (e: React.PointerEvent) => {
    if (status === 'running') return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = what;
    setStatus('idle');
    setLastRun(null);
  };

  const keyMove = (what: 'ball' | 'block') => (e: React.KeyboardEvent) => {
    if (status === 'running') return;
    const step =
      e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        ? -1
        : e.key === 'ArrowRight' || e.key === 'ArrowDown'
          ? 1
          : 0;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      release();
      return;
    }
    if (!step) return;
    e.preventDefault();
    setStatus('idle');
    setLastRun(null);
    if (what === 'ball')
      setS((v) => Math.max(START_MIN, Math.min(START_MAX, v + step * 0.05)));
    else setBx((v) => Math.max(BLOCK.min, Math.min(BLOCK.max, v + step * 10)));
  };

  // Static pen drawing of the stack, ramp and ground.
  const scenery = useMemo(
    () => ({
      ground: penLine(4, GROUND, SCENE.width - 2, GROUND + 1, 3, 1.5),
      blocks: [
        penRect(36, 230, 76, 60, 11),
        penRect(42, 170, 66, 60, 17),
        penRect(50, RAMP_TOP.y, 54, 60, 23),
      ],
      hatch: 'M58 128 l10 -10 M66 134 l14 -14 M76 138 l14 -14',
      ramp: penLine(RAMP_TOP.x, RAMP_TOP.y, RAMP_FOOT.x, RAMP_FOOT.y, 5, 1),
      rampUnder: penLine(
        RAMP_TOP.x,
        RAMP_TOP.y + 6,
        RAMP_FOOT.x - 4,
        RAMP_FOOT.y + 6,
        7,
        1,
      ),
      lip: `M${RAMP_FOOT.x} ${RAMP_FOOT.y} Q${(RAMP_FOOT.x + LIP.x) / 2 + 2} ${RAMP_FOOT.y + 4} ${LIP.x} ${LIP.y}`,
      lipUnder: `M${RAMP_FOOT.x - 4} ${RAMP_FOOT.y + 6} L${LIP.x + 2} ${GROUND} M${LIP.x} ${LIP.y} L${LIP.x + 2} ${GROUND}`,
    }),
    [],
  );

  const trace = lastRun
    ? lastRun.samples
        .filter((p, i) => p.t >= lastRun.launchAt - 0.02 && i % 6 === 0)
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ')
    : '';

  const verdict =
    status === 'done' && lastRun
      ? VERDICT[lastRun.outcome]
      : status === 'running'
        ? '…'
        : 'will it clear the last block?';

  return (
    <div className={`ramp ${compact ? 'is-compact' : ''}`}>
      <svg
        ref={svgRef}
        className="ramp-svg"
        viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
        role="group"
        aria-label="A pen sketch: a ball on a ramp built from stacked blocks, and a small block further along the ground."
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <g className="pen">
          <path d={scenery.ground} />
          {scenery.blocks.map((d, i) => (
            <path key={i} d={d} />
          ))}
          <path className="faint" d={scenery.hatch} />
          <path d={scenery.ramp} />
          <path d={scenery.rampUnder} className="faint" />
          <path d={scenery.lip} />
          <path d={scenery.lipUnder} className="faint" />
        </g>

        {trace && <polyline className="ramp-trace" points={trace} />}

        <g
          className="ramp-block"
          role="slider"
          tabIndex={0}
          aria-label="Position of the last block"
          aria-valuemin={BLOCK.min}
          aria-valuemax={BLOCK.max}
          aria-valuenow={Math.round(bx)}
          onPointerDown={grab('block')}
          onKeyDown={keyMove('block')}
        >
          <rect
            className="hit"
            x={bx - 14}
            y={GROUND - BLOCK.h - 14}
            width={BLOCK.w + 28}
            height={BLOCK.h + 28}
          />
          <path
            className={`pen-block ${lastRun?.outcome === 'hits' || lastRun?.outcome === 'short' ? 'is-struck' : ''}`}
            d={penRect(bx, GROUND - BLOCK.h, BLOCK.w, BLOCK.h, 31)}
          />
          <path
            className="faint"
            d={`M${bx + 5} ${GROUND - 10} l8 -8 M${bx + 12} ${GROUND - 6} l12 -12`}
          />
        </g>

        <g
          ref={ballRef}
          className="ramp-ball"
          role="slider"
          tabIndex={0}
          aria-label="Starting height of the ball on the ramp. Enter releases it."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((1 - s / START_MAX) * 100)}
          onPointerDown={grab('ball')}
          onKeyDown={keyMove('ball')}
          transform={`translate(${rest.x} ${rest.y})`}
        >
          <circle className="hit" r={24} />
          <circle className="ball" r={BALL_R} />
          <path
            className="ball-mark"
            d={`M${-BALL_R + 3} 0 L${BALL_R - 3} 0`}
          />
        </g>

        <g className="ramp-note" aria-live="polite">
          <text x={430} y={52}>
            {verdict}
          </text>
          <path
            className="faint"
            d={`M${470} 62 C ${488} 110, ${bx + 10} ${150}, ${bx + 14} ${GROUND - BLOCK.h - 12}`}
          />
        </g>
      </svg>

      <div className="ramp-controls">
        <button type="button" onClick={release} disabled={status === 'running'}>
          Release
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <p className="xp-hint">
          Drag the ball up or down the ramp. Drag the block along the ground.
        </p>
      </div>
    </div>
  );
}
