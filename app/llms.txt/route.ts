import { ENTRIES } from '@/content/field-notes';
import { SITE } from '@/content/site';
import { GROUPS, WORK } from '@/content/work';
import { AWARDS } from '@/lib/seo';

export const dynamic = 'force-static';

// A plain-text summary of the site for AI assistants (https://llmstxt.org).
// Built from the same content files as the pages.
export function GET() {
  const work = GROUPS.map((g) => {
    const items = WORK.filter((w) => w.group === g.id);
    if (!items.length) return '';
    return [
      `### ${g.title}`,
      '',
      ...items.map((w) =>
        [
          `- [${w.title}](${SITE.url}/work/#${w.slug}): ${w.org}${w.role ? `, ${w.role}` : ''} (${w.period}). ${w.summary}`,
          ...(w.highlights ?? []).map((h) => `  - ${h}`),
          `  - Tools: ${w.stack.join(', ')}`,
          ...(w.links ?? []).map((l) => `  - ${l.label}: ${l.href}`),
        ].join('\n'),
      ),
      '',
    ].join('\n');
  }).join('\n');

  const notes = ENTRIES.filter((e) => !e.demo);
  const body = `# ${SITE.name}

> ${SITE.bio}

This is Gabrio Lina's personal site: his work, his field notes, and small interactive experiments. Contact is through LinkedIn.

- Location: ${SITE.location} (open to relocation)
- LinkedIn: ${SITE.links.linkedin}
- GitHub: ${SITE.links.github}
- Languages: Portuguese (native), English (fluent; working language)

## Pages

- [Home](${SITE.url}/)
- [Work](${SITE.url}/work/): every role and project, with what he did and the tools used
- [About](${SITE.url}/about/): background, awards, skills and contact
- [Field notes](${SITE.url}/field-notes/): notes, studies and pictures
- [Experiments](${SITE.url}/experiments/): interactive models

## Work

${work}
## Awards

${AWARDS.map((a) => `- ${a}`).join('\n')}

## Education

- BSc in Computer Science (9.29/10), Inteli — Institute of Technology and Leadership, São Paulo, 2022–2025. Eleven team projects for industry partners.

## Skills

- Languages: Java, Python, C#, TypeScript, SQL
- Frameworks: Spring Boot, ASP.NET, FastAPI, Node.js, Angular, Next.js, LangGraph
- Infrastructure and data: AWS, Kubernetes, Docker, Terraform, Jenkins, GitHub Actions, PostgreSQL
${
  notes.length
    ? `
## Field notes

${notes.map((e) => `- [${e.title}](${SITE.url}/field-notes/${e.slug}/) (${e.date}): ${e.summary}`).join('\n')}
`
    : ''
}`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
