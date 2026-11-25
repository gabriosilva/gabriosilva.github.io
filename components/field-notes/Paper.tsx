import type { CSSProperties, ReactNode } from 'react';

// Things stuck onto the folded paper in an Unfold. See WRITING.md.

type Place = {
  /** Degrees; a little tilt makes it look placed by hand. */
  tilt?: number;
  /** Where it sits across the panel: left, center or right. */
  side?: 'left' | 'center' | 'right';
  /** Inside <Together>: where its middle sits, in % of the panel. */
  x?: number;
  y?: number;
  /** Width, in % of the panel. */
  w?: number;
};

const place = ({ tilt = 0, side = 'center', x, y, w }: Place) => ({
  className: `stuck ${x === undefined ? `stuck-${side}` : 'stuck-at'}`,
  style: {
    '--tilt': `${tilt}deg`,
    ...(x !== undefined && { '--x': `${x}%`, '--y': `${y ?? 50}%` }),
    ...(w !== undefined && { '--w': `${w}%` }),
  } as CSSProperties,
});

/** Several things on one panel, each placed with x, y (and w). */
export function Together({ children }: { children: ReactNode }) {
  return <div className="together">{children}</div>;
}

/** A handwritten sticky note, stuck on by its glue strip. */
export function Postit({
  children,
  tilt = -2,
  color = 'yellow',
  ...at
}: Place & { children: ReactNode; color?: 'yellow' | 'pink' | 'blue' | 'green' }) {
  const p = place({ tilt, ...at });
  return (
    <div className={`${p.className} postit postit-${color}`} style={p.style}>
      <span className="postit-lift" aria-hidden="true" />
      <div className="postit-paper">
        <div className="postit-text">{children}</div>
      </div>
    </div>
  );
}

/**
 * Blue ballpoint. The pen rests a moment before the first letter, skips here
 * and there, slips off at the end, and the ink spreads in places. On paper it
 * soaks in along the fibres and gets smudged by the hand; on a glossy print it
 * mostly stays put.
 */
function Ink({ text, on }: { text: string; on: 'print' | 'paper' }) {
  const id = `ink-${on}`;
  const paper = on === 'paper';
  const len = Math.round(text.length * 13.3);
  const end = 12 + len;
  const at = (f: number) => 12 + f * len;
  return (
    <svg
      className={`ink ink-on-${on}`}
      viewBox={`0 0 ${end + 18} 60`}
      style={{ aspectRatio: `${end + 18} / 60`, ['--units' as string]: end + 18 }}
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id={id} x="-8%" y="-30%" width="116%" height="160%" colorInterpolationFilters="sRGB">
          {/* the hand's wobble and the surface's tooth */}
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={1} seed={4} result="grain" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={paper ? 1.3 : 0.9}
            xChannelSelector="R"
            yChannelSelector="G"
            result="line"
          />
          {/* a ballpoint's uneven flow */}
          <feTurbulence type="fractalNoise" baseFrequency="0.08 0.3" numOctaves={2} seed={11} result="flow" />
          <feColorMatrix in="flow" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 0.2" result="flowA" />
          <feComposite in="line" in2="flowA" operator="in" result="pen" />
          {/* ink spreading where the surface took more of it */}
          <feGaussianBlur in="line" stdDeviation={paper ? 1.7 : 1.5} result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves={1} seed={8} result="fibres" />
          <feDisplacementMap
            in="soft"
            in2="fibres"
            scale={paper ? 3.2 : 0}
            xChannelSelector="R"
            yChannelSelector="B"
            result="wicked"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={21} result="patch" />
          <feColorMatrix
            in="patch"
            values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 ${paper ? -1.7 : -2.0}`}
            result="patchA"
          />
          <feComposite in="wicked" in2="patchA" operator="in" result="bleed" />
          <feComponentTransfer in="bleed" result="bleedSoft">
            <feFuncA type="linear" slope={paper ? 0.95 : 0.85} />
          </feComponentTransfer>
          {/* a smudge, where the side of the hand dragged through it wet */}
          <feGaussianBlur in="line" stdDeviation="4 0.7" result="drag" />
          <feOffset in="drag" dx="6" dy="1.5" result="dragged" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={1} seed={33} result="hand" />
          <feColorMatrix
            in="hand"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -3.3"
            result="handA"
          />
          <feComposite in="dragged" in2="handA" operator="in" result="smudge" />
          <feComponentTransfer in="smudge" result="smudgeSoft">
            <feFuncA type="linear" slope={paper ? 0.45 : 0} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="smudgeSoft" />
            <feMergeNode in="bleedSoft" />
            <feMergeNode in="pen" />
          </feMerge>
        </filter>
        <mask id={`${id}-skips`}>
          <rect width={end + 18} height="60" fill="#fff" />
          <g stroke="#000" strokeLinecap="round">
            <path d={`M${at(0.27)} 22 l-4 22`} strokeWidth="1.4" />
            <path d={`M${at(0.68)} 20 l-3 10`} strokeWidth="1.1" />
            <path d={`M${at(0.88)} 30 l-3 12`} strokeWidth="1" />
          </g>
        </mask>
      </defs>
      <g filter={`url(#${id})`}>
        <circle cx="16.5" cy="29" r="1.9" />
        <text x="12" y="40" textLength={len} lengthAdjust="spacingAndGlyphs" mask={`url(#${id}-skips)`}>
          {text}
        </text>
        <path className="ink-slip" d={`M${end - 2} 37 q8 1 15 -11`} />
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
  aged = 'full',
  wear,
  cutout,
  plastic,
  tilt = 1.5,
  ...at
}: Place & {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: ReactNode;
  /** Written in pen over the print's top-right corner. */
  inked?: string;
  /** 'light' for a photo that already has a filter on it. */
  aged?: 'full' | 'light';
  /** 0–3: which of four ways the print is worn. */
  wear?: 0 | 1 | 2 | 3;
  /** Cut out of a print with scissors, around its subject. The src is then
   *  an image with a transparent background. */
  cutout?: boolean;
  /** Held down under a piece of clear sticky-back plastic. */
  plastic?: boolean;
}) {
  const p = place({ tilt, ...at });
  // Which way this print is worn: scratches, crease and sheen. Picked by its
  // file unless given.
  const worn =
    wear ?? [...src].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) % 4;
  return (
    <figure
      className={`${p.className} glued${aged === 'light' ? ' glued-light' : ''}${cutout ? ' glued-cutout' : ''}`}
      style={p.style}
      data-wear={worn}
    >
      {plastic && <span className="plastic-glue" aria-hidden="true" />}
      <div className="glued-print">
        <div className="glued-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
          <span className="glued-wear" aria-hidden="true" />
          {inked && <Ink text={inked} on="print" />}
        </div>
      </div>
      {plastic && <span className="plastic" aria-hidden="true" />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A line written straight onto the paper. */
export function Written({ children, tilt = 0, ...at }: Place & { children: ReactNode }) {
  const p = place({ tilt, ...at });
  return (
    <p className={`${p.className} written`} style={p.style}>
      {children}
    </p>
  );
}

/** A few words in blue ballpoint, straight onto the paper. */
export function Pen({ children, tilt = -4, ...at }: Place & { children: string }) {
  const p = place({ tilt, ...at });
  return (
    <div className={`${p.className} pen-note`} style={p.style}>
      <Ink text={children} on="paper" />
    </div>
  );
}
