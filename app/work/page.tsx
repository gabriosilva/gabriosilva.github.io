import type { Metadata } from 'next';
import { JsonLd, pageMeta, workJsonLd } from '@/lib/seo';
import WorkRow from '@/components/work/WorkRow';
import { GROUPS, WORK } from '@/content/work';

export const metadata: Metadata = pageMeta({
  title: 'Work',
  description:
    'Gabrio Lina’s work: software engineer at Morgan Stanley (trade allocation, payments, digital signing), electronic trading at BTG Pactual, site reliability at Descomplica, 1st place at the Adapta AI Challenge 2025, and university projects with industry partners.',
  path: '/work/',
});

export default function WorkPage() {
  return (
    <main id="main" className="page">
      <JsonLd data={workJsonLd()} />
      <header className="page-head">
        <h1>Work</h1>
        <p>
          Backend and full-stack systems, infrastructure, and AI agent tooling.
        </p>
      </header>

      {GROUPS.map((g) => {
        const items = WORK.filter((w) => w.group === g.id);
        if (!items.length) return null;
        return (
          <section
            key={g.id}
            className="work-group wide"
            aria-labelledby={`g-${g.id}`}
          >
            <h2 id={`g-${g.id}`}>{g.title}</h2>
            {g.blurb && <p>{g.blurb}</p>}
            <ul className="work-list">
              {items.map((item) => (
                <WorkRow key={item.slug} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
