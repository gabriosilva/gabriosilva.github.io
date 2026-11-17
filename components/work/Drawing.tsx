'use client';

import { useState } from 'react';
import { useCycle, useInView, useSeen } from '@/lib/hooks';
import { roundSvg } from '@/lib/round-svg';
import { DRAWINGS, type DrawingKey } from './drawings';

type Props = {
  name: DrawingKey;
  /** Loop while true (e.g. while the row is hovered). */
  active?: boolean;
  size?: 'thumb' | 'large';
  /** The drawing itself is a button that plays or pauses it. */
  tappable?: boolean;
  /** Loops quietly whenever it is on screen (small doodles). */
  ambient?: boolean;
};

/** Draws itself once when it comes into view, loops while active. */
export default function Drawing({
  name,
  active = false,
  size = 'thumb',
  tappable = false,
  ambient = false,
}: Props) {
  const d = DRAWINGS[name];
  const [ref, seen] = useSeen<HTMLDivElement>(0.5);
  const [viewRef, inView] = useInView<HTMLSpanElement>(0.2);
  const [looping, setLooping] = useState(false);
  const t = useCycle(
    d.duration,
    seen,
    active || looping || (ambient && inView),
    !ambient,
  );
  const art = (
    <svg viewBox="0 0 160 100" role="img" aria-label={d.label}>
      {roundSvg(d.draw(t))}
    </svg>
  );

  return (
    <div ref={ref} className={`drawing drawing-${size}`}>
      <span ref={viewRef} className="drawing-sentinel" aria-hidden="true" />
      {tappable ? (
        <button
          type="button"
          className="drawing-tap"
          aria-pressed={looping}
          title={looping ? 'Pause' : 'Play'}
          onClick={() => setLooping((v) => !v)}
        >
          {art}
        </button>
      ) : (
        art
      )}
      {size === 'large' && (
        <button
          type="button"
          className="drawing-toggle"
          aria-pressed={looping}
          onClick={() => setLooping((v) => !v)}
        >
          {looping ? 'Pause' : 'Play'}
        </button>
      )}
    </div>
  );
}
