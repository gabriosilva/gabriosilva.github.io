import type { Metadata } from 'next';
import { JsonLd, pageMeta, experimentsJsonLd } from '@/lib/seo';
import Link from 'next/link';
import CardArt from '@/components/field-notes/CardArt';
import Drawing from '@/components/work/Drawing';
import { ENTRIES } from '@/content/field-notes';
import { WORK } from '@/content/work';

export const metadata: Metadata = pageMeta({
  title: 'Experiments',
  description:
    'Interactive experiments by Gabrio Lina: a pulse network, a ball-and-ramp physics sketch, and small animated drawings of real engineering work.',
  path: '/experiments/',
});

export default function ExperimentsPage() {
  const studies = ENTRIES.filter((e) => e.experiment);
  return (
    <main id="main" className="page">
      <JsonLd data={experimentsJsonLd()} />
      <header className="page-head">
        <h1>Experiments</h1>
      </header>

      <h2 className="section-label wide">Interactive</h2>
      <ul className="xp-index wide">
        {studies.map((e) => (
          <li key={e.slug}>
            <Link href={`/field-notes/${e.slug}/`}>
              <div className="art">
                <CardArt art={e.art} />
              </div>
              <strong>{e.experiment}</strong>
              <span>in “{e.title}”</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="section-label wide">From the work</h2>
      <ul className="xp-index wide">
        {WORK.map((w) => (
          <li key={w.slug}>
            <Link href={`/work/#${w.slug}`}>
              <Drawing name={w.drawing} />
              <strong>{w.title}</strong>
              <span>{w.org}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
