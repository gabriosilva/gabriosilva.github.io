import type { ReactNode } from 'react';

// Things stuck onto the folded paper in an Unfold. See WRITING.md.

type Place = {
  /** Degrees; a little tilt makes it look placed by hand. */
  tilt?: number;
  /** Where it sits across the panel: left, center or right. */
  side?: 'left' | 'center' | 'right';
};

/** A handwritten sticky note, stuck on by its glue strip. */
export function Postit({
  children,
  tilt = -2,
  side = 'center',
  color = 'yellow',
}: Place & { children: ReactNode; color?: 'yellow' | 'pink' | 'blue' | 'green' }) {
  return (
    <div
      className={`stuck stuck-${side} postit postit-${color}`}
      style={{ ['--tilt' as string]: `${tilt}deg` }}
    >
      <span className="postit-lift" aria-hidden="true" />
      <div className="postit-paper">
        <div className="postit-text">{children}</div>
      </div>
    </div>
  );
}

/**
 * Written over a corner of a print in blue ballpoint: the pen rested before
 * the first letter, skipped a little on the gloss, slipped off at the end,
 * and the ink spread a bit in places.
 */
function Inked({ children }: { children: string }) {
  return (
    <svg className="glued-ink" viewBox="0 0 200 60" role="img" aria-label={children}>
      <defs>
        <filter
          id="glued-ink"
          x="-5%"
          y="-20%"
          width="110%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={1} seed={4} result="grain" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={0.9}
            xChannelSelector="R"
            yChannelSelector="G"
            result="line"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.08 0.3"
            numOctaves={2}
            seed={11}
            result="flow"
          />
          <feColorMatrix
            in="flow"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 0.2"
            result="flowA"
          />
          <feComposite in="line" in2="flowA" operator="in" result="pen" />
          <feGaussianBlur in="line" stdDeviation="1.5" result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={21} result="patch" />
          <feColorMatrix
            in="patch"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -2.0"
            result="patchA"
          />
          <feComposite in="soft" in2="patchA" operator="in" result="bleed" />
          <feComponentTransfer in="bleed" result="bleedSoft">
            <feFuncA type="linear" slope="0.85" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="bleedSoft" />
            <feMergeNode in="pen" />
          </feMerge>
        </filter>
        <mask id="glued-ink-skips">
          <rect width="200" height="60" fill="#fff" />
          <g stroke="#000" strokeLinecap="round">
            <path d="M58 22 L54 44" strokeWidth="1.4" />
            <path d="M131 20 L128 30" strokeWidth="1.1" />
            <path d="M163 30 L160 42" strokeWidth="1" />
          </g>
        </mask>
      </defs>
      <g filter="url(#glued-ink)">
        <circle cx="16.5" cy="29" r="1.9" />
        <text x="12" y="40" textLength="172" lengthAdjust="spacingAndGlyphs" mask="url(#glued-ink-skips)">
          {children}
        </text>
        <path className="glued-ink-slip" d="M182 37 q8 1 15 -11" />
      </g>
    </svg>
  );
}

/** An old photo print glued onto the paper, with an optional handwritten caption. */
export function Glued({
  src,
  alt,
  width,
  height,
  caption,
  inked,
  tilt = 1.5,
  side = 'center',
}: Place & {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: ReactNode;
  /** Written in pen over the print's top-right corner. */
  inked?: string;
}) {
  return (
    <figure
      className={`stuck stuck-${side} glued`}
      style={{ ['--tilt' as string]: `${tilt}deg` }}
    >
      <div className="glued-print">
        <div className="glued-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
          <span className="glued-wear" aria-hidden="true" />
          {inked && <Inked>{inked}</Inked>}
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A line written straight onto the paper. */
export function Written({ children, side = 'center', tilt = 0 }: Place & { children: ReactNode }) {
  return (
    <p className={`stuck stuck-${side} written`} style={{ ['--tilt' as string]: `${tilt}deg` }}>
      {children}
    </p>
  );
}
