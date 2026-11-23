import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ENTRIES, formatDate, getEntry } from '@/content/field-notes';
import { JsonLd, entryJsonLd, pageMeta } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = getEntry((await params).slug);
  if (!entry) return {};
  return pageMeta({
    title: entry.title,
    description: entry.summary,
    path: `/field-notes/${entry.slug}/`,
    type: 'article',
    publishedTime: entry.date,
    // Placeholder entries stay out of search results until replaced.
    noindex: entry.demo,
    image: {
      url: `/og/${entry.slug}.png`,
      width: 1200,
      height: 630,
      alt: entry.image?.alt ?? entry.title,
    },
  });
}

export default async function EntryPage({ params }: Params) {
  const entry = getEntry((await params).slug);
  if (!entry) notFound();
  const { default: Body } = await entry.load();
  const index = ENTRIES.indexOf(entry);
  const newer = ENTRIES[index - 1];
  const older = ENTRIES[index + 1];

  return (
    <main id="main" className="page prose">
      <JsonLd data={entryJsonLd(entry)} />
      <header className="entry-head">
        <p className="meta">
          <Link href="/field-notes/">Field notes</Link> · {entry.kind} ·{' '}
          <time dateTime={entry.date}>{formatDate(entry.date, 'long')}</time>
        </p>
        <h1>{entry.title}</h1>
      </header>

      <Body />

      <nav className="next-work" aria-label="More field notes">
        {older ? (
          <Link href={`/field-notes/${older.slug}/`}>← {older.title}</Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link href={`/field-notes/${newer.slug}/`}>{newer.title} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
