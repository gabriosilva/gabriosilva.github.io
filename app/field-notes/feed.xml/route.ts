import { ENTRIES } from '@/content/field-notes';
import { SITE } from '@/content/site';

export const dynamic = 'force-static';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** RSS feed of the field notes, for feed readers and crawlers. */
export function GET() {
  const items = ENTRIES.filter((e) => !e.demo)
    .map((e) => {
      const url = `${SITE.url}/field-notes/${e.slug}/`;
      return `    <item>
      <title>${esc(e.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${e.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${e.kind}</category>
      <description>${esc(e.summary)}</description>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — Field notes</title>
    <link>${SITE.url}/field-notes/</link>
    <atom:link href="${SITE.url}/field-notes/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notes, studies, pictures and pages by ${esc(SITE.name)}.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
