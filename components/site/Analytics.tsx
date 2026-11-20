'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export default function Analytics() {
  useEffect(() => {
    if (!KEY || process.env.NODE_ENV !== 'production') return;
    if (posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      // The App Router changes pages without a reload; count those too.
      capture_pageview: 'history_change',
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: true,
      respect_dnt: true,
    });
  }, []);
  return null;
}
