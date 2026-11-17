'use client';

import { useId, useState } from 'react';

// Adapted from the illustration in the notebook proof of concept.
// A slider moves the patch of light across the wall and warms or cools it.
export default function WindowLight() {
  const [v, setV] = useState(50);
  const id = useId();
  const shift = (v - 50) * 0.9;
  const warmth = Math.abs(v - 50) / 50;
  const sky = `hsl(${lerp(205, 30, warmth)} ${lerp(18, 45, warmth)}% ${lerp(74, 70, warmth)}%)`;
  const light = `hsl(${lerp(50, 32, warmth)} ${lerp(70, 85, warmth)}% ${lerp(91, 82, warmth)}%)`;
  return (
    <div className="window-study">
      <svg
        viewBox="0 0 440 290"
        role="img"
        aria-label="An illustration of light falling through a window onto a wall, with a plant on the floor"
      >
        <defs>
          <linearGradient id={`${id}-sky`} x2="0" y2="1">
            <stop stopColor={sky} />
            <stop offset="1" stopColor="#eee3cc" />
          </linearGradient>
          <linearGradient id={`${id}-wall`}>
            <stop stopColor="#d6d3ca" />
            <stop offset="1" stopColor="#ecebe3" />
          </linearGradient>
        </defs>
        <rect width="440" height="290" fill={`url(#${id}-wall)`} />
        <g
          style={{ transition: 'transform 600ms cubic-bezier(.22,1,.36,1)' }}
          transform={`translate(${shift} 0)`}
        >
          <path
            d="M245 112L440 202V290H286L144 191Z"
            fill={light}
            opacity={0.9 - warmth * 0.25}
          />
          <path
            d="M242 123L440 218V227L239 130ZM188 159L333 290H320L182 166Z"
            fill="#ccc4af"
            opacity=".5"
          />
        </g>
        <rect x="69" y="30" width="176" height="176" fill="#8c8c81" />
        <rect x="77" y="36" width="162" height="164" fill={`url(#${id}-sky)`} />
        <path
          d="M77 174L115 147L138 156L172 120L208 141L239 126V200H77Z"
          fill="#80969b"
          opacity=".55"
        />
        <path
          d="M77 187L124 172L158 183L197 157L239 173V200H77Z"
          fill="#76857f"
          opacity=".6"
        />
        <path d="M155 36V200M77 118H239" stroke="#ede9dd" strokeWidth="7" />
        <path d="M67 205H251V212H67Z" fill="#f6f2e5" />
        <path d="M69 212H250L257 218H76Z" fill="#b9b7a9" />
        <path d="M298 230Q325 204 349 225L344 258H306Z" fill="#a59f8c" />
        <path
          d="M323 230Q321 184 338 163M326 201Q299 184 300 175Q322 175 326 201M329 187Q351 187 354 170Q335 169 329 187"
          fill="#687b6a"
          stroke="#687b6a"
          strokeWidth="2"
        />
      </svg>
      <label>
        Time of day
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
