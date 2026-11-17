import Link from 'next/link';
import PulseNetwork from '@/components/contraptions/PulseNetwork';
import { ENTRIES, formatDate, getEntry } from '@/content/field-notes';
import type { Metadata } from 'next';
import { JsonLd, homeJsonLd, pageMeta } from '@/lib/seo';
import { SITE } from '@/content/site';

export const metadata: Metadata = pageMeta({
  title: `${SITE.name} — ${SITE.role}`,
  description: SITE.description,
  path: '/',
  absoluteTitle: true,
});

export default function Home() {
  return (
    <main id="main" className="page home">
      <JsonLd data={homeJsonLd()} />

      <h1 className="home-line">
        I’m Gabrio, a software engineer, and before that I made films.
      </h1>
      <p className="home-sub">
        <Link href="/work/">The work →</Link>
      </p>

      <figure className="home-toy">
        <PulseNetwork bare />
        <figcaption className="meta">
          Touch a point.
          {getEntry('a-few-connections') && (
            <>
              {' '}
              <Link href="/field-notes/a-few-connections/">What is this?</Link>
            </>
          )}
        </figcaption>
      </figure>

      <section className="home-notes" aria-labelledby="home-notes">
        <h2 id="home-notes" className="section-label">
          Field notes <Link href="/field-notes/">All entries →</Link>
        </h2>
        <ul>
          {ENTRIES.slice(0, 3).map((e) => (
            <li key={e.slug}>
              <time dateTime={e.date}>{formatDate(e.date)}</time>
              <Link href={`/field-notes/${e.slug}/`}>{e.title}</Link>
              <span>
                {e.kind}
                {e.demo && <> · demo</>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
