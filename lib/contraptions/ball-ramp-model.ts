// "Will it clear the last block?" — a ball rolls down a ramp, leaves a small
// lip, flies, lands and rolls. Deterministic: the whole run is simulated up
// front, then played back.

export const SCENE = { width: 640, height: 330 };
export const GROUND = 290;
export const BALL_R = 8;
export const RAMP_TOP = { x: 104, y: 110 };
export const RAMP_FOOT = { x: 300, y: 280 };
export const LIP = { x: 328, y: 272 };
export const LAUNCH_ANGLE = (38 * Math.PI) / 180;
export const BLOCK = { w: 30, h: 40, min: 380, max: 600 };
export const START_MIN = 0;
export const START_MAX = 0.8;

const G = 1500; // px/s²
const ROLL = 5 / 7; // a rolling ball keeps 5/7 of its energy as forward motion
const FRICTION = 260; // px/s² while rolling on the ground

export type Sample = { t: number; x: number; y: number };
export type Run = {
  samples: Sample[];
  outcome: 'clears' | 'hits' | 'short';
  landX: number | null;
  hitAt: number | null; // time of impact (s), for the thud
  landAt: number | null;
  launchAt: number;
  margin: number; // vertical clearance over the block (px), negative if it hits
};

/** Ball centre at ramp position s (0 = top, 1 = foot). */
export function rampPoint(s: number) {
  const dx = RAMP_FOOT.x - RAMP_TOP.x;
  const dy = RAMP_FOOT.y - RAMP_TOP.y;
  const len = Math.hypot(dx, dy);
  // Offset the centre perpendicular to the ramp so the ball sits on it.
  const nx = dy / len;
  const ny = -dx / len;
  return {
    x: RAMP_TOP.x + dx * s + nx * BALL_R,
    y: RAMP_TOP.y + dy * s + ny * BALL_R,
  };
}

export function simulate(start: number, blockX: number): Run {
  const samples: Sample[] = [];
  const dt = 1 / 240;
  const top = RAMP_TOP;
  const foot = RAMP_FOOT;
  const len = Math.hypot(foot.x - top.x, foot.y - top.y);
  const sinA = (foot.y - top.y) / len;
  const a = G * sinA * ROLL;

  // 1. Down the ramp, constant acceleration.
  let t = 0;
  let d = 0;
  let v = 0;
  const dist = (1 - start) * len;
  while (d < dist) {
    const p = rampPoint(start + d / len);
    samples.push({ t, ...p });
    t += dt;
    v += a * dt;
    d += v * dt;
  }

  // 2. Over the lip, at the speed energy allows at that height.
  const startY = rampPoint(start).y;
  const lipC = { x: LIP.x, y: LIP.y - BALL_R };
  const vLip = Math.sqrt(Math.max(0, 2 * G * ROLL * (lipC.y - startY)));
  const footC = rampPoint(1);
  const lipLen = Math.hypot(lipC.x - footC.x, lipC.y - footC.y);
  const lipTime = lipLen / Math.max(1, (v + vLip) / 2);
  for (let k = 0; k < lipTime; k += dt) {
    const f = k / lipTime;
    samples.push({
      t,
      x: footC.x + (lipC.x - footC.x) * f,
      y: footC.y + (lipC.y - footC.y) * f,
    });
    t += dt;
  }
  const launchAt = t;

  // 3. Flight.
  let x = lipC.x;
  let y = lipC.y;
  let vx = vLip * Math.cos(LAUNCH_ANGLE);
  let vy = -vLip * Math.sin(LAUNCH_ANGLE);
  const top_ = GROUND - BLOCK.h;
  const left = blockX - BALL_R;
  const right = blockX + BLOCK.w + BALL_R;
  let margin = Infinity;
  let outcome: Run['outcome'] = 'clears';
  let hitAt: number | null = null;
  let landAt: number | null = null;
  let landX: number | null = null;
  const floor = GROUND - BALL_R;

  for (let guard = 0; guard < 5000; guard++) {
    samples.push({ t, x, y });
    t += dt;
    vy += G * dt;
    x += vx * dt;
    y += vy * dt;
    if (x >= left && x <= right) margin = Math.min(margin, top_ - BALL_R - y);
    // Hits the block's face or top edge.
    if (x >= left && x <= right && y > top_ - BALL_R) {
      outcome = 'hits';
      hitAt = t;
      x = Math.min(x, left);
      break;
    }
    if (y >= floor) {
      y = floor;
      landAt = t;
      landX = x;
      break;
    }
  }

  // 4. On the ground: roll with friction, or drop after hitting the block.
  if (outcome === 'hits') {
    // Bounce back a little, then drop and settle.
    vx = -Math.abs(vx) * 0.18;
    vy = Math.max(vy, 0) * 0.2;
    for (let guard = 0; guard < 2000; guard++) {
      samples.push({ t, x, y });
      t += dt;
      vy += G * dt;
      x += vx * dt;
      y += vy * dt;
      if (y >= floor) {
        y = floor;
        vy = -vy * 0.25;
        if (Math.abs(vy) < 40) vy = 0;
        vx *= 0.9;
      }
      if (vy === 0 && Math.abs(vx) < 4) break;
    }
  } else {
    // A small bounce on landing reads better than a dead stop.
    const landingVy =
      Math.abs(samples[samples.length - 1].y - samples[samples.length - 2].y) /
      dt;
    let bounceV = -landingVy * 0.22;
    for (let guard = 0; guard < 4000; guard++) {
      samples.push({ t, x, y });
      t += dt;
      bounceV += G * dt;
      y += bounceV * dt;
      if (y >= floor) {
        y = floor;
        bounceV = Math.abs(bounceV) > 60 ? -Math.abs(bounceV) * 0.3 : 0;
      }
      vx = Math.max(0, vx - FRICTION * dt);
      x += vx * dt;
      // Rolling into the block from the left counts as falling short.
      if (x > left && x < blockX && y > top_ - BALL_R) {
        x = left;
        outcome = 'short';
        hitAt = hitAt ?? t;
        vx = 0;
      }
      // The page ends here; let the ball come to rest at the edge.
      if (x > SCENE.width - 14) {
        x = SCENE.width - 14;
        vx = 0;
      }
      if (vx === 0 && bounceV === 0) break;
    }
  }

  samples.push({ t, x, y });
  // Landing and stopping before the block never got past it.
  if (outcome === 'clears' && x < blockX + BLOCK.w) outcome = 'short';
  return {
    samples,
    outcome,
    landX,
    hitAt,
    landAt,
    launchAt,
    margin: Number.isFinite(margin) ? margin : 0,
  };
}

export function sampleAt(run: Run, t: number): Sample {
  const s = run.samples;
  if (t <= 0) return s[0];
  if (t >= s[s.length - 1].t) return s[s.length - 1];
  // Samples are evenly spaced except the last; binary search is cheap anyway.
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  const f = (t - a.t) / (b.t - a.t || 1);
  return { t, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
