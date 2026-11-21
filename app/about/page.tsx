import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/content/site';
import { JsonLd, aboutJsonLd, pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'About',
  description:
    'Gabrio Lina is a software engineer at Morgan Stanley in São Paulo, working on trade allocation, payments and digital signing. Previously BTG Pactual and Descomplica. BSc Computer Science, Inteli. Open to relocation.',
  path: '/about/',
  type: 'profile',
});

export default function AboutPage() {
  return (
    <main id="main" className="page prose">
      <JsonLd data={aboutJsonLd()} />
      <header className="page-head">
        <h1>About</h1>
      </header>

      <p className="lede" style={{ marginTop: 0 }}>
        I’m Gabrio Lina, a software engineer at Morgan Stanley in São Paulo. I
        build software for trade allocation, payments and digital signing,
        across Java, C# and Angular, with global teams.
      </p>
      <p>
        I studied Computer Science at Inteli, where every term ended with a
        working product for an industry partner: a flight route planner, a
        compiler for therapy activities, a reinforcement-learning agent for
        trade matching, and more. Before that I worked as a site reliability
        engineer, and before that I made films.
      </p>
      <p>
        These days I work on backend and full-stack systems and on AI agent
        tooling. I’m learning C++ by writing neural networks from scratch.
      </p>

      <h2>In short</h2>
      <dl className="facts">
        <div>
          <dt>
            Software Engineer (Analyst) <span>· Morgan Stanley</span>
          </dt>
          <dd>Aug 2025 – present</dd>
        </div>
        <div>
          <dt>
            Software Engineer Intern <span>· Morgan Stanley</span>
          </dt>
          <dd>Jan 2024 – Jul 2025</dd>
        </div>
        <div>
          <dt>
            Summer Intern, Electronic Trading <span>· BTG Pactual</span>
          </dt>
          <dd>2023</dd>
        </div>
        <div>
          <dt>
            Junior Site Reliability Engineer <span>· Descomplica</span>
          </dt>
          <dd>2021 – 2022</dd>
        </div>
        <div>
          <dt>
            BSc Computer Science, 9.29/10 <span>· Inteli</span>
          </dt>
          <dd>2022 – 2025</dd>
        </div>
      </dl>
      <p className="more">
        <Link href="/work/">The work, in more detail →</Link>
      </p>

      <h2>Awards</h2>
      <ul>
        <li>
          1st place, Adapta AI Challenge 2025, Brazil’s largest generative AI
          hackathon
        </li>
        <li>1st place, Hackatour Cataratas 2023</li>
        <li>2nd place, Brasa Hacks 2022</li>
        <li>Finalist, VCIC Brasil</li>
      </ul>

      <h2>Languages and tools</h2>
      <p>
        Java, Python, C#, TypeScript and SQL. Spring Boot, ASP.NET, FastAPI,
        Node.js, Angular, Next.js and LangGraph. AWS, Kubernetes, Docker,
        Terraform, Jenkins, GitHub Actions and PostgreSQL. Portuguese (native)
        and English (fluent; my working language).
      </p>

      <h2>Get in touch</h2>
      <p>
        Based in São Paulo and open to relocation. The easiest way to reach me
        is LinkedIn.
      </p>
      <ul className="contact">
        <li>
          <a href={SITE.links.linkedin}>LinkedIn</a>
        </li>
        <li>
          <a href={SITE.links.github}>GitHub</a>
        </li>
      </ul>

      <h2 id="photos">Photos</h2>
      <p>
        The photos on this site are mine, all rights reserved. If you’d like
        to use one, ask me on <a href={SITE.links.linkedin}>LinkedIn</a>.
      </p>
    </main>
  );
}
