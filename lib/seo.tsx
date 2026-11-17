import type { Metadata } from 'next';
import type { Entry } from '@/content/field-notes';
import { SITE } from '@/content/site';
import { GROUPS, WORK } from '@/content/work';

// Everything search engines and AI systems read about the site lives here,
// built from the same content files as the pages, so it never drifts.

const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: `${SITE.name} — ${SITE.role}`,
};

export const PERSON_ID = `${SITE.url}/#person`;
const WEBSITE_ID = `${SITE.url}/#website`;

/** Full metadata for one page: title, description, canonical URL and share preview. */
export function pageMeta({
  title,
  description,
  path,
  type = 'website',
  publishedTime,
  absoluteTitle = false,
  noindex = false,
  image,
}: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  absoluteTitle?: boolean;
  noindex?: boolean;
  image?: { url: string; width: number; height: number; alt: string };
}): Metadata {
  const shareImage = image ?? OG_IMAGE;
  const shareTitle = absoluteTitle ? title : `${title} · ${SITE.name}`;
  const openGraph =
    type === 'article'
      ? {
          type: 'article' as const,
          publishedTime,
          authors: [SITE.url],
        }
      : type === 'profile'
        ? { type: 'profile' as const, firstName: 'Gabrio', lastName: 'Lina' }
        : { type: 'website' as const };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      types: {
        'application/rss+xml': [
          { url: '/field-notes/feed.xml', title: `${SITE.name} — Field notes` },
        ],
      },
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...openGraph,
      siteName: SITE.name,
      locale: 'en_GB',
      title: shareTitle,
      description,
      url: path,
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [shareImage.url],
    },
  };
}

export const AWARDS = [
  '1st place, Adapta AI Challenge 2025',
  '1st place, Hackatour Cataratas 2023',
  '2nd place, Brasa Hacks 2022',
  'Finalist, VCIC Brasil',
];

export function person() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.name,
    givenName: 'Gabrio',
    familyName: 'Lina',
    url: SITE.url,
    image: `${SITE.url}/og.png`,
    jobTitle: SITE.role,
    description: SITE.bio,
    worksFor: {
      '@type': 'Organization',
      name: 'Morgan Stanley',
      url: 'https://www.morganstanley.com',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Inteli — Institute of Technology and Leadership',
      url: 'https://www.inteli.edu.br',
    },
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Software Engineer',
      occupationLocation: { '@type': 'City', name: 'São Paulo' },
      skills:
        'Java, Spring Boot, C#, ASP.NET, Angular, TypeScript, Python, FastAPI, Next.js, LangGraph, AWS, Kubernetes, Terraform, PostgreSQL',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'São Paulo',
      addressCountry: 'BR',
    },
    knowsLanguage: ['English', 'Portuguese'],
    knowsAbout: [
      'Backend engineering',
      'Full-stack development',
      'Trade allocation systems',
      'Payments',
      'Digital signatures',
      'Electronic trading',
      'Transaction cost analysis',
      'Site reliability engineering',
      'AI agents',
      'Reinforcement learning',
      'Compilers',
    ],
    award: AWARDS,
    sameAs: [SITE.links.github, SITE.links.linkedin],
  };
}

function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

const graph = (...nodes: object[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });

export const homeJsonLd = () => graph(website(), person());

export const aboutJsonLd = () =>
  graph(
    {
      '@type': 'ProfilePage',
      '@id': `${SITE.url}/about/`,
      url: `${SITE.url}/about/`,
      name: `About ${SITE.name}`,
      isPartOf: { '@id': WEBSITE_ID },
      mainEntity: { '@id': PERSON_ID },
    },
    person(),
    breadcrumbs([{ name: 'About', path: '/about/' }]),
  );

export const workJsonLd = () =>
  graph(
    {
      '@type': 'CollectionPage',
      '@id': `${SITE.url}/work/`,
      url: `${SITE.url}/work/`,
      name: `Work · ${SITE.name}`,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': PERSON_ID },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: WORK.map((w, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            '@id': `${SITE.url}/work/#${w.slug}`,
            url: `${SITE.url}/work/#${w.slug}`,
            name: w.title,
            description: [w.summary, ...(w.highlights ?? [])].join(' '),
            creator: { '@id': PERSON_ID },
            sourceOrganization: { '@type': 'Organization', name: w.org },
            temporalCoverage: w.period,
            keywords: w.stack.join(', '),
            genre: GROUPS.find((g) => g.id === w.group)?.title,
            ...(w.links?.[0] ? { codeRepository: w.links[0].href } : {}),
          },
        })),
      },
    },
    person(),
    breadcrumbs([{ name: 'Work', path: '/work/' }]),
  );

export const fieldNotesJsonLd = (entries: Entry[]) =>
  graph(
    {
      '@type': 'Blog',
      '@id': `${SITE.url}/field-notes/`,
      url: `${SITE.url}/field-notes/`,
      name: `Field notes · ${SITE.name}`,
      description:
        'Notes, studies with interactive models, pictures and arranged pages by Gabrio Lina.',
      author: { '@id': PERSON_ID },
      isPartOf: { '@id': WEBSITE_ID },
      blogPost: entries
        .filter((e) => !e.demo)
        .map((e) => ({
          '@type': 'BlogPosting',
          headline: e.title,
          url: `${SITE.url}/field-notes/${e.slug}/`,
          datePublished: e.date,
        })),
    },
    breadcrumbs([{ name: 'Field notes', path: '/field-notes/' }]),
  );

export const entryJsonLd = (e: Entry) =>
  graph(
    {
      '@type': 'BlogPosting',
      '@id': `${SITE.url}/field-notes/${e.slug}/`,
      url: `${SITE.url}/field-notes/${e.slug}/`,
      mainEntityOfPage: `${SITE.url}/field-notes/${e.slug}/`,
      headline: e.title,
      description: e.summary,
      datePublished: e.date,
      dateModified: e.date,
      inLanguage: 'en',
      genre: e.kind,
      image: e.image
        ? {
            '@type': 'ImageObject',
            url: `${SITE.url}${e.image.src}`,
            width: e.image.width,
            height: e.image.height,
            caption: e.image.alt,
            creator: { '@id': PERSON_ID },
            copyrightHolder: { '@id': PERSON_ID },
          }
        : `${SITE.url}/og.png`,
      author: { '@id': PERSON_ID, name: SITE.name, url: SITE.url },
      isPartOf: { '@id': `${SITE.url}/field-notes/` },
      ...(e.experiment
        ? {
            hasPart: {
              '@type': 'WebApplication',
              name: e.experiment,
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Any (web browser)',
            },
          }
        : {}),
    },
    person(),
    breadcrumbs([
      { name: 'Field notes', path: '/field-notes/' },
      { name: e.title, path: `/field-notes/${e.slug}/` },
    ]),
  );

export const experimentsJsonLd = () =>
  graph(
    {
      '@type': 'CollectionPage',
      '@id': `${SITE.url}/experiments/`,
      url: `${SITE.url}/experiments/`,
      name: `Experiments · ${SITE.name}`,
      isPartOf: { '@id': WEBSITE_ID },
      author: { '@id': PERSON_ID },
    },
    breadcrumbs([{ name: 'Experiments', path: '/experiments/' }]),
  );

export function JsonLd({ data }: { data: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data.replace(/</g, '\\u003c') }}
    />
  );
}
