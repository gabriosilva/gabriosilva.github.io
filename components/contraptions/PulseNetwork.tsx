'use client';

import { useEffect, useRef } from 'react';
import { mountPulseNetwork } from '@/lib/contraptions/pulse-network';

type Props = { hold?: number; bare?: boolean };

/** The pulse network. Server HTML carries a readable description. */
export default function PulseNetwork({ hold, bare }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return mountPulseNetwork(ref.current, { hold, bare });
  }, [hold, bare]);
  return (
    <div ref={ref} className="xp">
      <p className="xp-fallback">
        Seven points, A to G, joined by nine paths. Touch a point and a pulse
        travels down every path; each point it reaches waits for a moment, then
        passes it on. The interactive version needs JavaScript.
      </p>
    </div>
  );
}
