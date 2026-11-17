'use client';

import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { GalleryProvider, StopContext } from './gallery';

// A loose, hand-placed timeline. A pen line runs down the middle; each Stop
// sits wherever you put it (x and w in % of the timeline width), on either
// side, slightly tilted, and settles into place like a sticker as it scrolls
// into view. On phones the line moves to the left and the stops stack.
// Only dated things are stops. Sketches and other extras go in an <Aside>:
// placed the same way, but with no marker on the line and no time.

const LINE = (() => {
  let d = 'M10 0';
  for (let y = 0; y < 1000; y += 100)
    d += ` C${y % 200 ? 4 : 16} ${y + 33}, ${y % 200 ? 16 : 4} ${y + 66}, 10 ${y + 100}`;
  return d;
})();

export function Timeline({ children }: { children: ReactNode }) {
  return (
    <div className="timeline wide">
      <svg
        className="timeline-line"
        viewBox="0 0 20 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={LINE} />
      </svg>
      <GalleryProvider>
        <ol>{children}</ol>
      </GalleryProvider>
    </div>
  );
}

type StopProps = {
  /** Short label above the stop, e.g. "Wed 23 Sep · 8:47 pm". */
  when?: string;
  /** Left edge and width, in % of the timeline (wide screens). */
  x?: number;
  w?: number;
  rotate?: number;
  tape?: boolean;
  /** Pulls the stop up (negative) or pushes it down, in rem. */
  shift?: number;
  /** Centred across the line, with no marker (for interactive pieces). */
  center?: boolean;
  /** The last stop: centred under the line, which finishes at its marker. */
  end?: boolean;
  /** Not an event: no marker, no connector, no time (see Aside). */
  aside?: boolean;
  children: ReactNode;
};

/** A sketch or note beside the timeline, not an entry on it. */
export function Aside(props: Omit<StopProps, 'when' | 'end' | 'aside'>) {
  return <Stop {...props} aside />;
}

export function Stop({
  when,
  x = 55,
  w = 34,
  rotate = 0,
  tape = false,
  shift = 0,
  center = false,
  end = false,
  aside = false,
  children,
}: StopProps) {
  const reduced = usePrefersReducedMotion();
  const right = x >= 50;
  // Marker on the line, positioned relative to this stop.
  const dot = end ? 50 : ((50 - x) / w) * 100;
  const style = {
    '--x': `${center || end ? 50 - w / 2 : x}%`,
    '--w': `${w}%`,
    '--shift': `${shift}rem`,
    '--dot': `${dot}%`,
    '--leader-left': right ? `${dot}%` : '100%',
    '--leader-width': right ? `${-dot}%` : `${dot - 100}%`,
  } as CSSProperties;

  return (
    <li
      className={`stop ${end ? 'is-end' : center ? 'is-center' : right ? 'is-right' : 'is-left'}${aside ? ' is-aside' : ''}`}
      style={style}
    >
      {!center && !end && !aside && (
        <span className="stop-leader" aria-hidden="true" />
      )}
      {!center && !aside && <span className="stop-dot" aria-hidden="true" />}
      <motion.div
        className="stop-card"
        initial={
          reduced
            ? false
            : {
                opacity: 0,
                y: 18,
                rotate: rotate + (right ? 5 : -5),
                scale: 0.96,
              }
        }
        whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -12% 0px' }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        style={reduced ? { rotate } : undefined}
      >
        {when && !aside && <time className="stop-when">{when}</time>}
        {tape && <span className="tape" aria-hidden="true" />}
        <StopContext.Provider value={{ when: aside ? undefined : when }}>
          {children}
        </StopContext.Provider>
      </motion.div>
    </li>
  );
}
