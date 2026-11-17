import type { Metadata } from 'next';
import { JsonLd, pageMeta, fieldNotesJsonLd } from '@/lib/seo';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import CardArt from '@/components/field-notes/CardArt';
import { ENTRIES, formatDate } from '@/content/field-notes';

export const metadata: Metadata = pageMeta({
  title: 'Field notes',
  description:
    'Gabrio Lina’s field notes: travel photos, short notes and studies with interactive models.',
  path: '/field-notes/',
});

// A slight, fixed tilt per card so the index feels laid out by hand.
const TILTS = [-0.6, 0.5, -0.3, 0.7, -0.5, 0.2];

export default function FieldNotesPage() {
  return (
    <main id="main" className="page">
      <JsonLd data={fieldNotesJsonLd(ENTRIES)} />
      <header className="page-head">
        <h1>Field notes</h1>
        <p>Notes, photos and interactive studies.</p>
      </header>
      {ENTRIES.some((e) => e.demo) && (
        <p className="demo">
          The entries marked Demo are examples to copy from. They show here
          while you work, and are left out of the published site.
        </p>
      )}
      <ul className="cards wide">
        {ENTRIES.map((e, i) => (
          <li
            key={e.slug}
            className={`card ${e.kind === 'Note' ? 'is-note' : ''}`}
            style={
              { '--tilt': `${TILTS[i % TILTS.length]}deg` } as CSSProperties
            }
          >
            <Link href={`/field-notes/${e.slug}/`}>
              <CardArt art={e.art} image={e.image} />
              <span className="kind">
                <span>
                  {e.kind}
                  {e.demo && (
                    <>
                      {' '}
                      · <span className="demo-tag">Demo</span>
                    </>
                  )}
                </span>
                <time dateTime={e.date}>{formatDate(e.date)}</time>
              </span>
              <h2>{e.title}</h2>
              <p>{e.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
