// The field notes' table of contents. To add an entry:
// 1. write content/field-notes/<slug>.mdx
// 2. add it to PUBLISHED below (newest first)
// Examples to copy from live in EXAMPLES and only show up in development.
// See WRITING.md for the blocks you can use inside an entry.

import type { ComponentType } from 'react';

export type EntryKind =
  'Note' | 'Essay' | 'Study' | 'Visual' | 'Travel' | 'Spread' | 'Project';

export type Entry = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: EntryKind;
  summary: string;
  /** Set for you on every entry in EXAMPLES; never write it by hand. */
  demo?: boolean;
  /** Which small picture to show on the field-notes card. */
  art?: 'pulse' | 'ramp' | 'window' | 'spread' | 'ferry' | 'tree' | 'none';
  /** A photo for the field-notes card and the share preview. */
  image?: { src: string; alt: string; width: number; height: number };
  /** The entry contains something to play with; listed under Experiments. */
  experiment?: string;
  load: () => Promise<{ default: ComponentType }>;
};

/**
 * Whether example entries are part of the site. They are on the development
 * server, so there is always something to copy from; in a production build
 * they are left out of the pages, the lists, the feeds and the code.
 * To preview a build with them: NEXT_PUBLIC_SHOW_DEMOS=1 npm run build
 */
export const SHOW_DEMOS =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SHOW_DEMOS === '1';

/** What is on the live site: add your own entries here, newest first. */
const PUBLISHED: Entry[] = [
  {
    slug: 'a-tree-from-one-rule',
    title: 'A tree from one rule',
    date: '2026-11-15',
    kind: 'Study',
    summary: 'A little experiment with trees.',
    art: 'tree',
    experiment: 'A fractal tree',
    load: () => import('./a-tree-from-one-rule.mdx'),
  },
  {
    slug: 'new-york',
    title: 'New York',
    date: '2026-11-14',
    kind: 'Travel',
    summary:
      'A few pictures from a recent trip to NYC, in the order they happened: Times Square on the first night, streets by day, and the skyline after dark.',
    image: {
      src: '/field-notes/new-york/12-skyline-night.jpg',
      alt: 'The Lower Manhattan skyline just after sunset, with the first windows lit.',
      width: 1000,
      height: 667,
    },
    art: 'ferry',
    experiment: 'A ferry across the East River',
    load: () => import('./new-york.mdx'),
  },
];

/**
 * Examples of each kind of entry, to copy from when writing a new one. They
 * only exist while SHOW_DEMOS is true: the imports sit inside the condition,
 * so a production build never bundles them. To publish one, move it up into
 * PUBLISHED (and rewrite its text in your own voice).
 */
const EXAMPLES: Entry[] = SHOW_DEMOS
  ? [
      {
        slug: 'will-it-clear',
        title: 'Will it clear the last block?',
        date: '2026-11-14',
        kind: 'Study',
        summary:
          'A sketch that answers its own question, if you let the ball go.',
        art: 'ramp',
        experiment: 'Ball, ramp and block',
        load: () => import('./will-it-clear.mdx'),
      },
      {
        slug: 'a-few-connections',
        title: 'A few connections, a rhythm',
        date: '2026-11-14',
        kind: 'Study',
        summary: 'How a pause at each stop changes the route a signal takes.',
        art: 'pulse',
        experiment: 'Pulses and connections',
        load: () => import('./a-few-connections.mdx'),
      },
      {
        slug: 'a-window-a-little-light',
        title: 'A window, a little light',
        date: '2026-11-14',
        kind: 'Visual',
        summary:
          'An illustrated fragment. Move the light; notice what stays the same.',
        art: 'window',
        experiment: 'Light through a window',
        load: () => import('./a-window-a-little-light.mdx'),
      },
      {
        slug: 'a-page-from-the-field',
        title: 'A page from the field',
        date: '2026-11-14',
        kind: 'Spread',
        summary:
          'What a field-notebook spread looks like here: pieces placed by hand, responding when touched.',
        art: 'spread',
        load: () => import('./a-page-from-the-field.mdx'),
      },
      {
        slug: 'a-note-can-be-this-short',
        title: 'A note can be this short',
        date: '2026-11-14',
        kind: 'Note',
        summary: 'One observation, a question, nothing else.',
        art: 'none',
        load: () => import('./a-note-can-be-this-short.mdx'),
      },
    ]
  : [];

export const ENTRIES: Entry[] = [
  ...PUBLISHED,
  ...EXAMPLES.map((e) => ({ ...e, demo: true })),
].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const getEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);

export function formatDate(iso: string, style: 'short' | 'long' = 'short') {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
