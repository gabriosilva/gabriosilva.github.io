'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import { usePrefersReducedMotion } from '@/lib/hooks';

// The photos of a timeline, opened as one sequence. The full-screen view is a
// small version of the timeline itself: a pen line with a dot per photo. Move
// along it with the arrows, the keyboard, a swipe, or the dots; closing lands
// back on the page at the photo you ended on.

export type GalleryItem = {
  el: HTMLElement | null;
  src: string;
  full?: string;
  alt: string;
  caption?: ReactNode;
  when?: string;
  width?: number;
  height?: number;
};

type Gallery = {
  register: (id: string, get: () => GalleryItem) => () => void;
  open: (id: string) => void;
};

export const GalleryContext = createContext<Gallery | null>(null);
/** Lets a photo know the time label of the stop it sits in. */
export const StopContext = createContext<{ when?: string } | null>(null);

type Shown = GalleryItem & { id: string; label: string };
type View = { list: Shown[]; index: number; dir: number; navigated: boolean };

const STRIP_LINE = (() => {
  let d = 'M0 10';
  for (let x = 0; x < 1000; x += 100)
    d += ` C${x + 33} ${x % 200 ? 5 : 15}, ${x + 66} ${x % 200 ? 15 : 5}, ${x + 100} 10`;
  return d;
})();

export function GalleryProvider({ children }: { children: ReactNode }) {
  const items = useRef(new Map<string, () => GalleryItem>());
  const [view, setView] = useState<View | null>(null);

  const gallery = useMemo<Gallery>(
    () => ({
      register(id, get) {
        items.current.set(id, get);
        return () => {
          items.current.delete(id);
        };
      },
      open(id) {
        // In page order, whatever order the photos happened to mount in.
        const list = [...items.current.entries()]
          .map(([key, get]) => ({ id: key, ...get() }))
          .filter((i) => i.el)
          .sort((a, b) =>
            a.el!.compareDocumentPosition(b.el!) &
            Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1,
          );
        // "9:31 pm" inherits the day from the stop before it.
        let day = '';
        const shown = list.map((i) => {
          const w = i.when ?? '';
          if (w.includes(' · ')) day = w.split(' · ')[0];
          const label = !w || w.includes(' · ') || !day ? w : `${day} · ${w}`;
          return { ...i, label };
        });
        const index = Math.max(
          0,
          shown.findIndex((i) => i.id === id),
        );
        setView({ list: shown, index, dir: 0, navigated: false });
      },
    }),
    [],
  );

  return (
    <GalleryContext.Provider value={gallery}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {view && <Viewer key="viewer" view={view} setView={setView} />}
          </AnimatePresence>,
          document.body,
        )}
    </GalleryContext.Provider>
  );
}

const slide = {
  enter: (d: number) => ({ x: d * 90, opacity: 0, rotate: d * 3, scale: 0.97 }),
  center: { x: 0, opacity: 1, rotate: 0, scale: 1 },
  exit: (d: number) => ({
    x: d * -90,
    opacity: 0,
    rotate: d * -3,
    scale: 0.97,
  }),
};

function Viewer({
  view,
  setView,
}: {
  view: View;
  setView: Dispatch<SetStateAction<View | null>>;
}) {
  const reduced = usePrefersReducedMotion();
  const { list, index, dir, navigated } = view;
  const item = list[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  const step = useCallback(
    (d: number) =>
      setView((v) => {
        if (!v) return v;
        const i = v.index + d;
        if (i < 0 || i >= v.list.length) return v;
        return { ...v, index: i, dir: d, navigated: true };
      }),
    [setView],
  );

  const jump = (i: number) =>
    setView((v) =>
      v && i !== v.index
        ? { ...v, index: i, dir: i > v.index ? 1 : -1, navigated: true }
        : v,
    );

  const close = useCallback(() => {
    document.body.style.overflow = '';
    const el = item.el;
    if (navigated && el) {
      // Land on the page where you ended up, and let that photo settle.
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const figure = el.closest('figure');
      if (figure) {
        figure.classList.add('is-landed');
        window.setTimeout(() => figure.classList.remove('is-landed'), 900);
      }
    }
    setView(null);
    el?.focus({ preventScroll: true });
  }, [item, navigated, setView]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, step]);

  // Have the neighbours ready, so moving along never waits on a download.
  useEffect(() => {
    for (const n of [list[index + 1], list[index - 1]]) {
      if (!n) continue;
      const img = new Image();
      img.src = n.full ?? n.src;
    }
  }, [list, index]);

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <motion.div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Photos from this entry"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={close}
    >
      <button
        ref={closeRef}
        type="button"
        className="viewer-close"
        onClick={close}
      >
        Close
      </button>

      <div className="viewer-stage">
        <button
          type="button"
          className="viewer-arrow"
          aria-label="Previous photo"
          disabled={index === 0}
          onClick={(e) => {
            stop(e);
            step(-1);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </button>

        <div className="viewer-photos">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={item.id}
              className="viewer-photo"
              custom={dir}
              variants={reduced ? undefined : slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              // The first photo flies out of its sticker; after that they slide.
              layoutId={!navigated && !reduced ? item.id : undefined}
              drag={reduced ? false : 'x'}
              dragSnapToOrigin
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) step(1);
                else if (info.offset.x > 60) step(-1);
              }}
              onClick={stop}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.full ?? item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                draggable={false}
                style={{ backgroundImage: `url(${item.src})` }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="viewer-arrow"
          aria-label="Next photo"
          disabled={index === list.length - 1}
          onClick={(e) => {
            stop(e);
            step(1);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5 L16 12 L9 19" />
          </svg>
        </button>
      </div>

      <div className="viewer-info" onClick={stop} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={item.id}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {item.label && <span className="viewer-when">{item.label}</span>}
            {item.caption && (
              <span className="viewer-caption">{item.caption}</span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="viewer-strip" onClick={stop}>
        <svg
          viewBox="0 0 1000 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={STRIP_LINE} />
        </svg>
        {list.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className={`viewer-dot ${i === index ? 'is-current' : i < index ? 'is-past' : ''}`}
            aria-label={`Photo ${i + 1} of ${list.length}${it.label ? `, ${it.label}` : ''}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => jump(i)}
          />
        ))}
      </div>
    </motion.div>
  );
}
