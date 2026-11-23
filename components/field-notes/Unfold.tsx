'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { hand } from '@/lib/hand-font';
import { paperRenderer, type PanelSpec } from '@/lib/paper-shader';

// Opening: each crease lets go a little after the one above it, while the
// rest of the folded stack still hangs from it.
const OPEN_STEP = 170; // ms between creases letting go
const OPEN_SWING = 1150; // ms for one crease to open
// Closing: folded up from the bottom, a bit quicker.
const CLOSE_STEP = 140;
const CLOSE_SWING = 800;

/** Folded flat: alternately behind and back again, so the stack zigzags. */
const restAngle = (i: number) => (i % 2 ? 179 : -179);

// Light from above and in front, in the page's coordinates (y down, z out).
const LY = -0.55;
const LZ = 0.835;

const easeOpen = (t: number) => {
  // Falls open, swings a touch past flat and settles, like paper does.
  const c = 0.8;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
const easeClose = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * A long sheet of paper folded like an accordion. Tapping the cover lets
 * the folds go one after another, each panel carrying the rest of the stack
 * down with it, until the sheet hangs all the way down. Once it's open it
 * can be folded back up, from the bottom.
 * Each child goes on its own panel; empty panels are added so there is
 * always some length to unfold.
 */
export default function Unfold({
  label,
  children,
  panels,
}: {
  /** Written on the cover. */
  label: string;
  children?: ReactNode;
  /** At least this many panels below the cover. */
  panels?: number;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  const count = Math.max(items.length, panels ?? 4);
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const started = phase !== 'closed';

  const root = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLButtonElement>(null);
  const panelEls = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Paint the paper with the shader; the CSS paper stays as a fallback.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let alive = true;
    const paint = async () => {
      const r = await paperRenderer();
      const coverCanvas = cover.current?.querySelector<HTMLCanvasElement>('.unfold-paper');
      if (!r || !alive || !coverCanvas || !cover.current) return;
      const w = cover.current.clientWidth;
      const h = cover.current.clientHeight;
      const rgb = getComputedStyle(el)
        .getPropertyValue('--sheet-rgb')
        .trim()
        .split(/\s+/)
        .map(Number);
      const tint = (rgb.length === 3 ? rgb : [247, 243, 234]).map((c) => c / 255) as [
        number,
        number,
        number,
      ];
      const specs: PanelSpec[] = [
        { canvas: coverCanvas, index: 0, offset: 0, lean: 1, topCrease: false, bottomCrease: true },
      ];
      panelEls.current.slice(0, count).forEach((panel, k) => {
        if (!panel) return;
        const i = k + 1;
        const base = {
          index: i,
          offset: i * h,
          lean: (i % 2 ? -1 : 1) as 1 | -1,
          topCrease: true,
          bottomCrease: i < count,
        };
        const front = panel.querySelector<HTMLCanvasElement>(':scope > .unfold-paper:not(.is-back)');
        const back = panel.querySelector<HTMLCanvasElement>(':scope > .unfold-paper.is-back');
        if (front) specs.push({ ...base, canvas: front });
        if (back) specs.push({ ...base, canvas: back, back: true });
      });
      r.render(specs, w, h, tint);
    };
    void paint();
    let last = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === last) return;
      last = el.clientWidth;
      void paint();
    });
    ro.observe(el);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [count]);

  /** Pose the chain: each crease's angle, the light on each panel, the height. */
  const pose = (angles: number[]) => {
    const el = root.current;
    const ph = cover.current?.clientHeight ?? 0;
    if (!el || !ph) return;
    let a = 0; // panel's angle in the page, degrees
    let y = ph; // where it hangs from
    let low = ph;
    angles.forEach((theta, i) => {
      const panel = panelEls.current[i];
      a += theta;
      const r = (a * Math.PI) / 180;
      y += ph * Math.cos(r);
      low = Math.max(low, y);
      if (!panel) return;
      panel.style.transform = `rotateX(${theta}deg)`;
      // Whichever face is towards us, how much light does it catch?
      const sign = Math.cos(r) >= 0 ? 1 : -1;
      const lit = (sign * (-Math.sin(r) * LY + Math.cos(r) * LZ)) / LZ;
      panel.style.setProperty('--lit', Math.min(1.04, Math.max(0.62, 0.62 + 0.4 * lit)).toFixed(3));
    });
    el.style.height = `${low + 14}px`;
  };

  const run = (
    from: number[],
    to: number[],
    order: number[],
    step: number,
    swing: number,
    ease: (t: number) => number,
    done: () => void,
  ) => {
    cancelAnimationFrame(frame.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const angles = from.map((f, i) => {
        const t = Math.min(1, Math.max(0, (now - t0 - order[i] * step) / swing));
        return f + (to[i] - f) * ease(t);
      });
      pose(angles);
      if (now - t0 < (count - 1) * step + swing) frame.current = requestAnimationFrame(tick);
      else done();
    };
    frame.current = requestAnimationFrame(tick);
  };

  const settle = (open: boolean) => setPhase(open ? 'open' : 'closed');

  // At rest, hand the pose back to CSS so it follows the page's width.
  // A layout effect, so the class and the cleared styles land in one frame.
  useLayoutEffect(() => {
    if (phase !== 'open' && phase !== 'closed') return;
    root.current?.style.removeProperty('height');
    panelEls.current.forEach((p) => {
      p?.style.removeProperty('transform');
      p?.style.removeProperty('--lit');
    });
  }, [phase]);

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const folded = Array.from({ length: count }, (_, i) => restAngle(i));
  const flat = Array.from({ length: count }, () => 0);
  const down = Array.from({ length: count }, (_, i) => i);
  const up = Array.from({ length: count }, (_, i) => count - 1 - i);

  const open = () => {
    if (phase === 'open') return close();
    if (phase !== 'closed') return;
    if (reduced()) return settle(true);
    setPhase('opening');
    pose(folded);
    run(folded, flat, down, OPEN_STEP, OPEN_SWING, easeOpen, () => settle(true));
  };

  const close = () => {
    if (phase !== 'open') return;
    const quick = reduced();
    cover.current?.focus({ preventScroll: true });
    const el = root.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      if (top < window.scrollY) window.scrollTo({ top, behavior: quick ? 'auto' : 'smooth' });
    }
    if (quick) return settle(false);
    setPhase('closing');
    pose(flat);
    run(flat, folded, up, CLOSE_STEP, CLOSE_SWING, easeClose, () => settle(false));
  };

  // Each panel hangs from the one above it, so the folded rest moves with it.
  const panel = (i: number): ReactNode =>
    i >= count ? null : (
      <div
        ref={(node) => {
          panelEls.current[i] = node;
        }}
        className={`unfold-panel unfold-sheet ${i % 2 ? 'is-mountain' : 'is-valley'}`}
        aria-hidden={phase === 'open' ? undefined : true}
      >
        <canvas className="unfold-paper" aria-hidden="true" />
        <canvas className="unfold-paper is-back" aria-hidden="true" />
        {items[i]}
        {panel(i + 1)}
      </div>
    );

  return (
    <div
      ref={root}
      className={`unfold ${hand.variable}${started ? ' is-started' : ''}${
        phase === 'open' ? ' is-open' : ''
      }${phase === 'opening' || phase === 'closing' ? ' is-moving' : ''}`}
      style={{ ['--opened' as string]: phase === 'open' ? count : 0 }}
    >
      <noscript>
        <style>{`.unfold-panel{visibility:visible!important;transform:none!important}.unfold{--opened:${count}!important}.unfold-hint,.unfold-back{display:none}`}</style>
      </noscript>
      <button
        ref={cover}
        type="button"
        className="unfold-cover unfold-sheet"
        onClick={open}
        aria-expanded={started}
        aria-label={
          phase === 'open' ? `${label}. Fold it back up.` : started ? label : `${label}. Open it.`
        }
      >
        <canvas className="unfold-paper" aria-hidden="true" />
        <span className="unfold-label">{label}</span>
        <span className="unfold-hint meta" aria-hidden="true">
          open ↓
        </span>
      </button>
      <div className="unfold-edges" aria-hidden="true" />
      <div className="unfold-chain">{panel(0)}</div>
      <button
        type="button"
        className="unfold-back meta"
        onClick={close}
        hidden={phase !== 'open'}
      >
        fold it back up ↑
      </button>
    </div>
  );
}
