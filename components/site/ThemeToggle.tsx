'use client';

import { useEffect, useState } from 'react';

/** Switches between the light page (default) and dark; remembered per visitor. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try {
      if (next) localStorage.setItem('theme', 'dark');
      else localStorage.removeItem('theme');
    } catch {}
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next ? '#161513' : '#fbfaf7');
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light page' : 'Switch to dark page'}
      title={dark ? 'Light' : 'Dark'}
      onClick={toggle}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 2 A6 6 0 0 1 8 14 Z" />
      </svg>
    </button>
  );
}
