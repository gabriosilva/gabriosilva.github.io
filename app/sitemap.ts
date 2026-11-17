import type { MetadataRoute } from 'next';
import { ENTRIES } from '@/content/field-notes';
import { SITE } from '@/content/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = ENTRIES[0]?.date ?? new Date().toISOString().slice(0, 10);
  const page = (path: string, priority: number, lastModified = latest) => ({
    url: `${SITE.url}${path}`,
    priority,
    lastModified,
  });
  return [
    page('/', 1),
    page('/work/', 0.9),
    page('/about/', 0.8),
    page('/field-notes/', 0.7),
    page('/experiments/', 0.5),
    ...ENTRIES.filter((e) => !e.demo).map((e) =>
      page(`/field-notes/${e.slug}/`, 0.5, e.date),
    ),
  ];
}
