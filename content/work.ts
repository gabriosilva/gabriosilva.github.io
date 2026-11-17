// Everything on the Work pages comes from Gabrio's CV and GitHub profile.
// Story fields (why, decisions, learned) are left empty until written by him;
// empty fields are simply not shown on the site.

import type { DrawingKey } from '@/components/work/drawings';

export type WorkGroup = 'now' | 'before' | 'side' | 'university';

export type WorkItem = {
  slug: string;
  group: WorkGroup;
  title: string;
  org: string;
  role?: string;
  period: string;
  summary: string;
  drawing: DrawingKey;
  extraDrawings?: DrawingKey[];
  highlights?: string[];
  stack: string[];
  links?: { label: string; href: string }[];
  note?: string;
  story?: {
    why?: string;
    decisions?: string;
    learned?: string;
  };
};

export const GROUPS: { id: WorkGroup; title: string; blurb?: string }[] = [
  { id: 'now', title: 'Now' },
  { id: 'before', title: 'Before' },
  { id: 'side', title: 'Outside work' },
  {
    id: 'university',
    title: 'University projects',
    blurb:
      'Team projects built for industry partners during my Computer Science degree at Inteli. Each term ended with a working product. The repositories are forks of the originals published by Inteli, and their READMEs are in Portuguese.',
  },
];

export const WORK: WorkItem[] = [
  {
    slug: 'morgan-stanley',
    group: 'now',
    title: 'Trade allocation and digital signing',
    org: 'Morgan Stanley',
    role: 'Software Engineer (Analyst)',
    period: 'Aug 2025 – present',
    summary:
      'Backend and full-stack work on trade allocation and digital signing, with global teams.',
    drawing: 'allocation',
    extraDrawings: ['signature'],
    highlights: [
      'Migrated 75+ legacy endpoints of a trade allocation platform from C# to Java 21 and Spring Boot in under three months, cutting response times by more than 30% on some high-load endpoints.',
      'Redesigned and launched a signing platform for clients and operations teams in under six months as part of a small team. Built much of the Angular UI and designed and implemented signature validation end to end.',
      'Designed an AI-assisted migration workflow that other engineers on my team adopted, and presented workflows I built with Claude and Codex at engineering knowledge-sharing sessions.',
      'Built and presented an agentic debugging tool for failing builds with my training team in New York, during the firm’s three-month international training programme.',
    ],
    stack: ['Java 21', 'Spring Boot', 'C#', 'Angular'],
  },
  {
    slug: 'morgan-stanley-intern',
    group: 'before',
    title: 'Invoices and payments',
    org: 'Morgan Stanley',
    role: 'Software Engineer Intern',
    period: 'Jan 2024 – Jul 2025',
    summary:
      'A backend workflow for invoices and payments that replaced a mainframe integration.',
    drawing: 'invoice',
    highlights: [
      'Designed and built a backend workflow for invoices and payments, replacing a mainframe integration. Worked with Brazil Accounts Payable and global engineering teams on requirements, testing and launch.',
      'Upgraded applications from Angular 4 to 19 and Python 2.7 to 3.12, and built Python tools to automate jobs.',
    ],
    stack: ['Java', 'C#', 'Angular', 'Python'],
  },
  {
    slug: 'btg-pactual',
    group: 'before',
    title: 'Measuring execution algorithms',
    org: 'BTG Pactual',
    role: 'Summer Intern, Electronic Trading',
    period: 'Jan 2023 and Jul 2023',
    summary:
      'A Transaction Cost Analysis platform for execution algorithms, and a FIX protocol test application.',
    drawing: 'tca',
    highlights: [
      'Developed a Transaction Cost Analysis platform — a Python package and microservice — to measure the performance of execution algorithms (VWAP, TWAP, POV).',
      'Developed a FIX protocol test application in C# and ASP.NET to verify message exchange.',
    ],
    stack: ['Python', 'FastAPI', 'C#', 'ASP.NET', 'FIX'],
  },
  {
    slug: 'descomplica',
    group: 'before',
    title: 'Keeping an edtech platform running',
    org: 'Descomplica',
    role: 'Junior Site Reliability Engineer',
    period: 'Apr 2021 – Jan 2022',
    summary:
      'Kubernetes clusters, infrastructure as code, CI/CD and automation.',
    drawing: 'cluster',
    highlights: [
      'Operated Kubernetes clusters with Terraform, Ansible and Packer.',
      'Ran CI/CD on Jenkins and Spinnaker and automated operational tasks in Python and Node.js.',
    ],
    stack: [
      'Kubernetes',
      'AWS',
      'Terraform',
      'Ansible',
      'Packer',
      'Jenkins',
      'Spinnaker',
      'Python',
      'Node.js',
    ],
  },
  {
    slug: 'adapta-ai-challenge',
    group: 'side',
    title: 'Agents that learn a recorded task',
    org: 'Adapta AI Challenge 2025 · 1st place',
    role: 'Team STAG, with three teammates',
    period: 'Aug 2025',
    summary:
      'Two AI agent platforms, for browser automation and for usability and vulnerability testing. Both learn a recorded task and automate it.',
    drawing: 'replay',
    highlights: [
      'Won both stages of Brazil’s largest generative AI hackathon: 80 finalists from about 6,000 applicants.',
      'R$300,000+ (over €50,000) in cash prizes.',
    ],
    stack: ['AI agents', 'Browser automation'],
  },
  {
    slug: 'nutrition-app',
    group: 'side',
    title: 'An AI nutrition tracking app',
    org: 'Independent, with one other developer',
    period: '2024 – 2025',
    summary:
      'Built and ran the app for about a year. Around 100 people signed up.',
    drawing: 'nutrition',
    stack: [
      'Next.js',
      'FastAPI',
      'LangGraph',
      'PostgreSQL (RAG)',
      'AWS',
      'Terraform',
      'GitHub Actions',
    ],
  },
  {
    slug: 'rl-trade-matching',
    group: 'university',
    title: 'Reinforcement learning for trade matching',
    org: 'BTG Pactual',
    period: '2024',
    summary:
      'An agent (PPO) that learns how much of a spot purchase to match against a forward sale, in synthetic fixed income.',
    drawing: 'rl',
    stack: ['Python', 'PPO'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/rl-trade-matching',
      },
    ],
  },
  {
    slug: 'therapy-language-compiler',
    group: 'university',
    title: 'A language and compiler for therapy activities',
    org: 'AACD',
    period: '2023',
    summary:
      'A small language, compiler and desktop IDE used to create therapy activities for a sensory mat.',
    drawing: 'compiler',
    stack: ['Python', 'Electron', 'React'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/therapy-language-compiler',
      },
    ],
  },
  {
    slug: 'flightwise-route-planner',
    group: 'university',
    title: 'Low-altitude flight route planner',
    org: 'AEL Sistemas',
    period: '2023',
    summary: 'Plans low-altitude flight routes over terrain.',
    drawing: 'flight',
    stack: ['Java', 'Spring Boot', 'Neo4j', 'A*'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/flightwise-route-planner',
      },
    ],
  },
  {
    slug: 'paper-roll-cutting-optimiser',
    group: 'university',
    title: 'Paper-roll cutting optimiser',
    org: 'Klabin',
    period: '2023',
    summary:
      'Plans how to cut large paper rolls to fill orders with minimal waste.',
    drawing: 'paper',
    stack: ['Java'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/paper-roll-cutting-optimiser',
      },
    ],
  },
  {
    slug: 'traffic-spike-aws-architecture',
    group: 'university',
    title: 'Architecture for traffic spikes',
    org: 'Stone',
    period: '2023',
    summary:
      'AWS architecture for a web app that gets sudden bursts of visitors from TV advertising.',
    drawing: 'spike',
    stack: ['AWS'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/traffic-spike-aws-architecture',
      },
    ],
  },
  {
    slug: 'field-segmentation-unet',
    group: 'university',
    title: 'Field segmentation',
    org: 'A de Agro',
    period: '2024',
    summary:
      'Computer vision models that outline cultivated fields and estimate their area.',
    drawing: 'field',
    stack: ['Python', 'U-Net', 'ResUNet'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/field-segmentation-unet',
      },
    ],
  },
  {
    slug: 'support-chatbot-rag',
    group: 'university',
    title: 'Customer support chatbot',
    org: 'Brastel',
    period: '2024',
    summary:
      'Intent classification plus retrieval-augmented answers for support questions.',
    drawing: 'chatbot',
    stack: ['Python', 'RAG', 'LLaMA'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/support-chatbot-rag',
      },
    ],
  },
  {
    slug: 'greenhouse-iot-esp32',
    group: 'university',
    title: 'Greenhouse monitoring',
    org: 'Gerdau',
    period: '2022',
    summary:
      'ESP32 firmware and apps that track temperature and humidity in eucalyptus nurseries.',
    drawing: 'greenhouse',
    stack: ['C++', 'ESP32', 'React Native'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/greenhouse-iot-esp32',
      },
    ],
  },
  {
    slug: 'school-management-dashboard',
    group: 'university',
    title: 'School management dashboard',
    org: 'Falconi',
    period: '2022',
    summary:
      'A questionnaire and dashboard that show school leaders their strengths and gaps.',
    drawing: 'radar',
    stack: ['JavaScript', 'Node.js'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/school-management-dashboard',
      },
    ],
  },
  {
    slug: 'tv-audience-forecast',
    group: 'university',
    title: 'TV audience forecast',
    org: 'TV Gazeta',
    period: '2022',
    summary:
      'A model that predicts TV audience by time slot, with a site to explore the forecasts.',
    drawing: 'forecast',
    stack: ['Python', 'React'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/gabriosilva/tv-audience-forecast',
      },
    ],
  },
];

export const getWork = (slug: string) => WORK.find((w) => w.slug === slug);
