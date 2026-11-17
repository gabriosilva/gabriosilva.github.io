// One shared, opt-in sound engine for every contraption on the site.
// Off by default; the visitor turns it on explicitly.

const PENTATONIC = [
  392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5,
];

let ctx: AudioContext | null = null;
let enabled = false;
const listeners = new Set<(on: boolean) => void>();

export function soundEnabled() {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on && !ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) ctx = new Ctx();
  }
  if (on && ctx?.state === 'suspended') void ctx.resume();
  listeners.forEach((fn) => fn(on));
}

export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A short, soft pluck. `index` picks a note from a pentatonic scale. */
export function pluck(index: number, { gain = 0.16, length = 0.6 } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value =
    PENTATONIC[
      ((index % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length
    ];
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

/** A soft thud, for things landing. */
export function thud(strength = 1) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.25 * strength, t + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}
