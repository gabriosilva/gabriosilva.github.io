import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="page">
      <header className="page-head">
        <h1>Nothing here</h1>
        <p>This page doesn’t exist, or it moved when the site was rebuilt.</p>
      </header>
      <p>
        <Link href="/">Start from the beginning →</Link>
      </p>
    </main>
  );
}
