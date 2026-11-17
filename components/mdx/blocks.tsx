'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { GalleryContext, StopContext } from './gallery';
import { usePrefersReducedMotion } from '@/lib/hooks';

// ---- Note: a margin note beside its reference --------------------------------
export function Note({
  n,
  children,
}: {
  n: number | string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className="note-ref"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Note ${n}`}
        onClick={() => setOpen((v) => !v)}
      >
        {n}
      </button>
      <span id={id} className={`note ${open ? 'is-open' : ''}`} data-n={n}>
        {children}
      </span>
    </>
  );
}

// ---- Figure: an image or drawing that opens from where it sits ----------------
type FigureProps = {
  src?: string;
  alt?: string;
  caption?: ReactNode;
  /** Shown as a labelled empty frame until a real photo exists. */
  placeholder?: string;
  /** Intrinsic size, so the page doesn't jump while the photo loads. */
  width?: number;
  height?: number;
  /** Smaller versions for phones, e.g. "/a-1200.jpg 1200w, /a.jpg 2400w". */
  srcSet?: string;
  /** Wider than the text column on large screens. */
  wide?: boolean;
  /** How wide it shows, so the browser picks the right file. */
  sizes?: string;
  /** A larger file for the full-screen view; loaded only when opened. */
  full?: string;
  children?: ReactNode;
};

export function Figure({
  src,
  alt = '',
  caption,
  placeholder,
  width,
  height,
  srcSet,
  wide = false,
  sizes,
  full,
  children,
}: FigureProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reduced = usePrefersReducedMotion();
  // Inside a timeline, photos open as one sequence instead of one by one.
  const gallery = useContext(GalleryContext);
  const stopInfo = useContext(StopContext);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inGallery = Boolean(gallery && src);
  const latest = useRef({
    src,
    full,
    alt,
    caption,
    width,
    height,
    when: stopInfo?.when,
  });
  latest.current = {
    src,
    full,
    alt,
    caption,
    width,
    height,
    when: stopInfo?.when,
  };
  useEffect(() => {
    if (!gallery || !inGallery) return;
    return gallery.register(id, () => ({
      ...latest.current,
      src: latest.current.src!,
      el: buttonRef.current,
    }));
  }, [gallery, inGallery, id]);
  const art = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={
        sizes ??
        (wide
          ? '(min-width: 72rem) 56rem, 100vw'
          : '(min-width: 40rem) 38rem, 100vw')
      }
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  ) : placeholder ? (
    <div className="photo-placeholder">{placeholder}</div>
  ) : (
    children
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <figure className={wide ? 'figure wide' : 'figure'}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (inGallery ? gallery!.open(id) : setOpen(true))}
        aria-label={`Enlarge: ${alt || 'figure'}`}
      >
        <motion.div className="frame" layoutId={reduced ? undefined : id}>
          {art}
        </motion.div>
      </button>
      {caption && <figcaption>{caption}</figcaption>}
      {/* Rendered at the top of the page: inside a tilted sticker, a
          full-screen layer would be trapped within the sticker itself. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.button
                type="button"
                className="lightbox"
                aria-label="Close"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="frame"
                  layoutId={reduced ? undefined : id}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={full ?? src}
                      alt={alt}
                      width={width}
                      height={height}
                    />
                  ) : (
                    art
                  )}
                </motion.div>
                {caption && <span className="lightbox-caption">{caption}</span>}
              </motion.button>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </figure>
  );
}

// ---- Predict: commit to a guess, then see -------------------------------------
type PredictProps = {
  question: ReactNode;
  options: string[];
  answer: number;
  children?: ReactNode;
};

export function Predict({ question, options, answer, children }: PredictProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="predict" role="group" aria-label="A question to predict">
      <p className="predict-label">Predict first</p>
      <div className="predict-q">{question}</div>
      <div className="options">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            disabled={done}
            onClick={() => setPicked(i)}
            className={
              done
                ? i === answer
                  ? 'is-right'
                  : i === picked
                    ? 'is-wrong'
                    : ''
                : ''
            }
          >
            {o}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {done && (
          <motion.div
            className="reveal"
            aria-live="polite"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p>
              <strong>
                {picked === answer
                  ? 'Right.'
                  : `Not quite: it’s “${options[answer]}”.`}
              </strong>
            </p>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Spread: an arranged field-notebook page ----------------------------------
// You place each Item (x, y and width in % of the spread; rotate in degrees).
// Readers can nudge an item; it springs back to where you put it.
export function Spread({
  height = 640,
  children,
}: {
  height?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="spread wide"
      style={{ '--h': `${height}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}

type ItemProps = {
  x: number;
  y: number;
  w: number;
  rotate?: number;
  tape?: boolean;
  card?: boolean;
  children: ReactNode;
};

export function Item({
  x,
  y,
  w,
  rotate = 0,
  tape = false,
  card = false,
  children,
}: ItemProps) {
  const reduced = usePrefersReducedMotion();
  const constraints = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={constraints}
      className="spread-item"
      style={{
        rotate,
        ...({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}%` } as object),
      }}
      drag={!reduced}
      dragSnapToOrigin
      dragElastic={0.18}
      dragTransition={{ bounceStiffness: 320, bounceDamping: 18 }}
      whileHover={reduced ? undefined : { y: -3, rotate: rotate * 0.6 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      whileDrag={{ scale: 1.02, zIndex: 5 }}
    >
      {tape && <span className="tape" aria-hidden="true" />}
      {card ? <div className="card-like">{children}</div> : children}
    </motion.div>
  );
}

export function Scribble({ children }: { children: ReactNode }) {
  // A div, not a p: MDX may wrap multi-line text in its own paragraph.
  return <div className="scribble">{children}</div>;
}

// ---- Sound: a small player for a recording ------------------------------------
export function Sound({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="sound">
      <button
        type="button"
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play();
          else a.pause();
        }}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <span>{title}</span>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

// ---- Drafting aids --------------------------------------------------------------
/** Visible only while developing; never shipped to the live site. */
export function Todo({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') return null;
  return <div className="todo">To do: {children}</div>;
}

export function Demo({ children }: { children: ReactNode }) {
  return <p className="demo">{children}</p>;
}
