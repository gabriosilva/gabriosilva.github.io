'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/content/site';
import ThemeToggle from './ThemeToggle';

export default function Masthead() {
  const path = usePathname() ?? '/';
  return (
    <div className="page">
      <header className="masthead">
        <Link className="name" href="/">
          Gabrio Lina<span>.</span>
        </Link>
        <nav aria-label="Main">
          <ul>
            {SITE.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={
                    (
                      item.href === '/'
                        ? path === '/'
                        : path.startsWith(item.href.replace(/\/$/, ''))
                    )
                      ? 'page'
                      : undefined
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
}
