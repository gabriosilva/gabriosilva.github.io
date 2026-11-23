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

/** A photo glued onto the paper, with an optional handwritten caption. */
export function Glued({
  src,
  alt,
  width,
  height,
  caption,
  tilt = 1.5,
  side = 'center',
}: Place & {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: ReactNode;
}) {
  return (
    <figure
      className={`stuck stuck-${side} glued`}
      style={{ ['--tilt' as string]: `${tilt}deg` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
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
