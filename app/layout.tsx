import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Newsreader } from 'next/font/google';
import Masthead from '@/components/site/Masthead';
import { SITE } from '@/content/site';
import './globals.css';

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.role}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/field-notes/feed.xml', title: `${SITE.name} — Field notes` },
      ],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  keywords: [
    'Gabrio Lina',
    'software engineer',
    'Morgan Stanley',
    'São Paulo',
    'Java',
    'Spring Boot',
    'Angular',
    'backend engineer',
    'full-stack engineer',
    'AI agents',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    locale: 'en_GB',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Gabrio Lina — Software Engineer',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#fbfaf7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Masthead />
        {children}
        <div className="page">
          <footer className="foot">
            <span>{SITE.name}</span>
            <ul>
              <li>
                <a href={SITE.links.github}>GitHub</a>
              </li>
              <li>
                <a href={SITE.links.linkedin}>LinkedIn</a>
              </li>
            </ul>
          </footer>
        </div>
      </body>
    </html>
  );
}
