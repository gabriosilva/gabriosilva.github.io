'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { WorkItem } from '@/content/work';
import Drawing from './Drawing';

type Props = {
  item: WorkItem;
  /** Summary only, with a link to the full item on the Work page. */
  compact?: boolean;
};

/** One piece of work, fully readable in place: nothing to open. */
export default function WorkRow({ item, compact = false }: Props) {
  const [active, setActive] = useState(false);
  const story = item.story ?? {};
  return (
    <li
      id={compact ? undefined : item.slug}
      className={`work-row ${compact ? 'is-compact' : ''}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <div className="work-art">
        <Drawing name={item.drawing} active={active} tappable />
        {!compact &&
          item.extraDrawings?.map((d) => (
            <Drawing key={d} name={d} active={active} tappable />
          ))}
      </div>
      <div className="work-body">
        <h3>{item.title}</h3>
        <p className="org">
          {item.org}
          {item.role && <> · {item.role}</>} <span>· {item.period}</span>
        </p>
        <p className="summary">{item.summary}</p>

        {compact ? (
          <p className="more">
            <Link href={`/work/#${item.slug}`}>What I did there →</Link>
          </p>
        ) : (
          <>
            {story.why && <p className="summary">{story.why}</p>}
            {item.highlights && (
              <ul className="highlights">
                {item.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            {story.decisions && (
              <p className="summary">
                <strong>Decisions.</strong> {story.decisions}
              </p>
            )}
            {story.learned && (
              <p className="summary">
                <strong>What I learned.</strong> {story.learned}
              </p>
            )}
            <ul className="chips">
              {item.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
              {item.links?.map((l) => (
                <li key={l.href} className="chip-link">
                  <a href={l.href}>{l.label} →</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </li>
  );
}
