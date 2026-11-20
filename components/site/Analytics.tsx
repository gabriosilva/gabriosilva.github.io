'use client';

import { useEffect } from 'react';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export default function Analytics() {
  useEffect(() => {
    if (!KEY || process.env.NODE_ENV !== 'production') return;
    let cancelled = false;
    // Loaded once the page is idle, so it never competes with first paint.
    const start = () =>
      import('posthog-js').then(({ default: posthog }) => {
        if (cancelled || posthog.__loaded) return;
        posthog.init(KEY, {
          api_host: HOST,
          person_profiles: 'identified_only',
          // The App Router changes pages without a reload; count those too.
          capture_pageview: 'history_change',
          capture_pageleave: true,
          autocapture: true,
          disable_session_recording: true,
          disable_surveys: true,
          capture_dead_clicks: false,
          respect_dnt: true,
        });
      });
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 4000 })
      : window.setTimeout(start, 1500);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return null;
}
