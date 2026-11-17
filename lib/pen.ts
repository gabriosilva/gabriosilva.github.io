// Helpers for a consistent pen-drawn look: slightly imperfect, never random
// between renders (seeded), so server and client output match.

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A straight line with a subtle hand wobble, as an SVG path `d`. */
export function penLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 1,
  amount = 1.2,
) {
  const mx = (x1 + x2) / 2 + (rand(seed) - 0.5) * amount * 2;
  const my = (y1 + y2) / 2 + (rand(seed + 1) - 0.5) * amount * 2;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** A closed polygon with pen wobble on every side. */
export function penPoly(points: [number, number][], seed = 1, amount = 1) {
  return (
    points
      .map(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length];
        const seg = penLine(x, y, nx, ny, seed + i * 3, amount);
        return i === 0 ? seg : seg.replace(/^M[^Q]+/, '');
      })
      .join(' ') + ' Z'
  );
}

/** A rectangle drawn with pen wobble. */
export function penRect(
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 1,
  amount = 1,
) {
  return penPoly(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    seed,
    amount,
  );
}

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smooth ease that settles: fast start, gentle arrival. */
export const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Maps global progress t into a local 0..1 for the window [a, b]. */
export const phase = (t: number, a: number, b: number) =>
  clamp((t - a) / (b - a));
