import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { ENTRIES, formatDate, getEntry } from '@/content/field-notes';
import { SITE } from '@/content/site';

// The share preview for each field note, /og/<slug>.png, drawn at build
// time from the entry's title, kind and date, with its photo if it has one.
// New entries get one automatically.

const size = { width: 1200, height: 630 };

export const dynamicParams = false;

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ file: `${e.slug}.png` }));
}

const INK = '#1c1b18';
const MUTED = '#77736a';
const ACCENT = '#2547c9';
const CANVAS = '#fbfaf7';

/** The site's fonts, from Google Fonts. Offline, the default font is used. */
async function font(family: string) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}`, {
      // An old browser gets TTF, which the renderer can read.
      headers: { 'User-Agent': 'Mozilla/4.0' },
    }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function photo(src: string) {
  try {
    const data = await readFile(join(process.cwd(), 'public', src));
    const type = src.endsWith('.png') ? 'png' : src.endsWith('.webp') ? 'webp' : 'jpeg';
    return `data:image/${type};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const entry = getEntry((await params).file.replace(/\.png$/, ''));
  const [serif, sans] = await Promise.all([font('Newsreader:wght@400'), font('Instrument+Sans:wght@400')]);
  const pic = entry?.image ? await photo(entry.image.src) : null;
  const title = entry?.title ?? SITE.name;
  const long = title.length > 48;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: CANVAS,
          padding: '72px 80px',
          fontFamily: sans ? 'Instrument Sans' : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: MUTED }}>
            <div
              style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT, marginRight: 16 }}
            />
            {entry
              ? ['Field notes', entry.kind, formatDate(entry.date, 'long')].join('\u00a0\u00a0·\u00a0\u00a0')
              : 'Field notes'}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 'auto',
              fontFamily: serif ? 'Newsreader' : undefined,
              fontSize: pic ? (long ? 60 : 72) : long ? 72 : 88,
              lineHeight: 1.08,
              letterSpacing: '-0.01em',
              color: INK,
              paddingRight: pic ? 48 : 120,
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', marginTop: 40, fontSize: 28, color: INK }}>{SITE.name}</div>
        </div>
        {pic && entry?.image && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img
              src={pic}
              width={380}
              height={Math.round((380 * entry.image.height) / entry.image.width)}
              style={{
                maxHeight: 486,
                objectFit: 'cover',
                transform: 'rotate(1.5deg)',
                boxShadow: '0 10px 30px rgba(60,45,20,0.18)',
              }}
            />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(serif ? [{ name: 'Newsreader', data: serif, weight: 400 as const }] : []),
        ...(sans ? [{ name: 'Instrument Sans', data: sans, weight: 400 as const }] : []),
      ],
    },
  );
}
