'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** True once the element has been at least `threshold` visible. */
export function useSeen<T extends Element>(
  threshold = 0.4,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

/** True while the element is on screen. */
export function useInView<T extends Element>(
  threshold = 0.2,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/**
 * Drives a 0..1 progress value for small looping drawings.
 * - plays once when `play` first becomes true, then rests at 1
 * - loops while `loop` is true
 * - stays at 1 (the finished drawing) with reduced motion
 */
export function useCycle(
  duration: number,
  play: boolean,
  loop: boolean,
  /** Pause briefly at the end of each loop. */
  rest = true,
) {
  const reduced = usePrefersReducedMotion();
  const [t, setT] = useState(1);
  const played = useRef(false);
  // The server renders the finished drawing (good without JS); once running
  // in the browser, rewind so it can draw itself when it comes into view.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setT(0);
  }, []);
  useEffect(() => {
    if (reduced) {
      setT(1);
      return;
    }
    const once = play && !played.current;
    if (!once && !loop) return;
    played.current = true;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = (now - start) / duration;
      if (loop) {
        // A short rest at the end of each loop, unless it should flow on.
        setT(rest ? (p % 1.25 > 1 ? 1 : p % 1.25) : p % 1);
        raf = requestAnimationFrame(tick);
      } else if (p < 1) {
        setT(p);
        raf = requestAnimationFrame(tick);
      } else setT(1);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setT(1);
    };
  }, [play, loop, duration, reduced, rest]);
  return t;
}
