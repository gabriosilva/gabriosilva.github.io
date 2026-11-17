// A very small simulated world: flowers on a hill.
//
// A seed number decides everything random, so the same seed always grows the
// same meadow. Each flower grows a stem, opens, and every so often while in
// bloom drops a seed that drifts and lands nearby; then it fades. A landed
// seed becomes a new flower if there is room. When the hill is nearly bare a
// stray seed blows in from the side, so the world never stays empty.
// Planting by hand adds to the same world.

export type Flower = {
  id: number;
  x: number;
  born: number; // world time, seconds
  height: number;
  hue: number; // index into the petal colours
  petals: number;
  size: number;
  lean: number;
  life: number; // seconds before it starts to fade
  nextSeed: number; // age at which it next drops a seed
};

export type FlyingSeed = {
  id: number;
  x0: number;
  y0: number;
  x1: number;
  t0: number;
  dur: number;
};

export type Meadow = {
  t: number;
  flowers: Flower[];
  seeds: FlyingSeed[];
  rng: number; // generator state
  nextStray: number; // when a seed may next blow in
  nextId: number;
  width: number;
};

export const MAX_FLOWERS = 22;
export const FADE = 3; // seconds a flower takes to fade
const HUES = 5;

/** mulberry32: a small, well-behaved seeded generator. */
function random(m: Meadow) {
  m.rng = (m.rng + 0x6d2b79f5) | 0;
  let x = Math.imul(m.rng ^ (m.rng >>> 15), 1 | m.rng);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

function sprout(m: Meadow, x: number, born: number): Flower {
  return {
    id: m.nextId++,
    x,
    born,
    height: 15 + random(m) * 22,
    hue: Math.floor(random(m) * HUES),
    petals: 5 + Math.floor(random(m) * 3),
    size: 3.2 + random(m) * 1.6,
    lean: (random(m) - 0.5) * 10,
    life: 22 + random(m) * 16,
    nextSeed: 8 + random(m) * 5,
  };
}

const roomAt = (m: Meadow, x: number) =>
  x > 8 &&
  x < m.width - 8 &&
  Math.abs(x - m.width / 2) > 9 && // not on the trunk
  !m.flowers.some((f) => Math.abs(f.x - x) < 8);

export function createMeadow(seed: number, width: number): Meadow {
  const m: Meadow = {
    t: 0,
    flowers: [],
    seeds: [],
    rng: seed | 0,
    nextStray: 6,
    nextId: 1,
    width,
  };
  for (let i = 0; i < 7; i++) {
    const x = 16 + random(m) * (width - 32);
    const born = random(m) * 4;
    if (roomAt(m, x)) m.flowers.push(sprout(m, x, born));
  }
  return m;
}

/** Plants a flower by hand. Returns false if there is no room there. */
export function plant(m: Meadow, x: number) {
  if (m.flowers.length >= MAX_FLOWERS + 6 || !roomAt(m, x)) return false;
  m.flowers.push(sprout(m, x, m.t));
  return true;
}

/** Moves the world forward by dt seconds. `headOf` says where a bloom is. */
export function step(
  m: Meadow,
  dt: number,
  headOf: (f: Flower) => { x: number; y: number },
) {
  m.t += dt;
  const fly = (x0: number, y0: number, x1: number) =>
    m.seeds.push({
      id: m.nextId++,
      x0,
      y0,
      x1,
      t0: m.t,
      dur: 2.2 + random(m),
    });
  const crowded = () => m.flowers.length + m.seeds.length >= MAX_FLOWERS;

  for (const f of m.flowers) {
    const age = m.t - f.born;
    if (age < f.nextSeed || age > f.life) continue;
    f.nextSeed = age + 7 + random(m) * 7;
    if (crowded()) continue;
    // Try a few spots and take the first with room.
    for (let attempt = 0; attempt < 4; attempt++) {
      const side = random(m) < 0.5 ? -1 : 1;
      const x1 = f.x + side * (14 + random(m) * 60);
      if (!roomAt(m, x1)) continue;
      const head = headOf(f);
      fly(head.x, head.y, x1);
      break;
    }
  }

  // Nearly bare: a seed blows in from one side.
  if (m.flowers.length + m.seeds.length < 3 && m.t >= m.nextStray) {
    m.nextStray = m.t + 3 + random(m) * 4;
    const fromLeft = random(m) < 0.5;
    const x1 = 16 + random(m) * (m.width - 32);
    if (roomAt(m, x1)) fly(fromLeft ? -6 : m.width + 6, 150, x1);
  }

  for (const s of m.seeds)
    if (m.t >= s.t0 + s.dur && roomAt(m, s.x1))
      m.flowers.push(sprout(m, s.x1, m.t));
  m.seeds = m.seeds.filter((s) => m.t < s.t0 + s.dur);
  m.flowers = m.flowers.filter((f) => m.t - f.born < f.life + FADE);
}
