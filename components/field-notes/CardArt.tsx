import type { Entry } from '@/content/field-notes';
import { penLine, penRect } from '@/lib/pen';

// Small still pictures for field-note cards, in the same pen style.
export default function CardArt({
  art,
  image,
}: {
  art: Entry['art'];
  image?: Entry['image'];
}) {
  if (image)
    return (
      <div className="card-art card-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  if (!art || art === 'none') return null;
  return (
    <div className="card-art" aria-hidden="true">
      <svg viewBox="0 0 200 90">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {art === 'pulse' && <Pulse />}
          {art === 'ramp' && <Ramp />}
          {art === 'window' && <Window />}
          {art === 'spread' && <SpreadArt />}
          {art === 'ferry' && <FerryArt />}
          {art === 'tree' && <TreeArt />}
        </g>
      </svg>
    </div>
  );
}

function Pulse() {
  const pts: [number, number][] = [
    [20, 50],
    [52, 26],
    [86, 20],
    [96, 78],
    [124, 34],
    [158, 20],
    [180, 46],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 4],
    [4, 5],
    [5, 6],
    [0, 3],
    [3, 6],
    [2, 3],
    [4, 6],
  ];
  return (
    <>
      {edges.map(([a, b], i) => (
        <path key={i} d={penLine(...pts[a], ...pts[b], i)} opacity={0.5} />
      ))}
      <path
        d={`M${pts[0].join(' ')} L${pts[1].join(' ')} L${pts[2].join(' ')}`}
        stroke="var(--accent)"
        strokeWidth="2"
      />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4.5}
          fill={i < 3 ? 'var(--accent)' : 'var(--paper)'}
          stroke={i < 3 ? 'var(--accent)' : 'currentColor'}
        />
      ))}
    </>
  );
}

function Ramp() {
  return (
    <>
      <path d={penLine(4, 84, 196, 85, 3, 1.5)} />
      <path d={penRect(14, 60, 26, 24, 2)} />
      <path d={penRect(17, 38, 20, 22, 5)} />
      <path d="M37 40 L104 80 Q112 82 118 76" />
      <circle cx={44} cy={36} r={5} />
      <path d={penRect(150, 70, 12, 14, 9)} />
      <path
        d="M120 74 Q140 40 172 64"
        stroke="var(--accent)"
        strokeDasharray="1 5"
      />
      <text
        x={128}
        y={22}
        fill="var(--accent)"
        stroke="none"
        fontStyle="italic"
        fontSize="12"
        fontFamily="var(--serif)"
      >
        will it clear?
      </text>
    </>
  );
}

function Window() {
  return (
    <>
      <rect x={40} y={8} width={56} height={60} />
      <path d="M68 8 V68 M40 38 H96" />
      <path
        d="M96 30 L170 62 L150 86 L72 86 Z"
        fill="var(--accent-soft)"
        stroke="none"
      />
      <path d={penLine(10, 86, 190, 86, 2)} />
      <path d="M150 86 q4 -12 14 -10 l-2 10 M156 76 q-2 -10 6 -18" />
    </>
  );
}

function SpreadArt() {
  return (
    <>
      <g transform="rotate(-3 50 40)">
        <rect x={16} y={10} width={64} height={48} fill="var(--paper)" />
        <path d="M24 50 l14 -16 l10 10 l8 -6 l16 12" opacity={0.6} />
      </g>
      <rect
        x={42}
        y={4}
        width={22}
        height={7}
        fill="var(--accent-soft)"
        stroke="none"
        transform="rotate(-4 53 7)"
      />
      <g transform="rotate(2 130 30)">
        <rect x={98} y={12} width={72} height={34} fill="var(--paper)" />
        <path d="M106 24 h52 M106 32 h40 M106 40 h46" opacity={0.6} />
      </g>
      <path
        d="M92 78 C110 58, 126 84, 146 66 S174 70, 186 56"
        stroke="var(--accent)"
      />
    </>
  );
}

function FerryArt() {
  const buildings: [number, number, number][] = [
    [14, 9, 20],
    [25, 8, 30],
    [35, 12, 24],
    [49, 7, 42],
    [58, 13, 34],
    [73, 9, 26],
    [84, 12, 38],
    [98, 9, 28],
  ];
  return (
    <>
      <circle
        cx={66}
        cy={22}
        r={5}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
      />
      {buildings.map(([x, w, h], i) => (
        <path
          key={i}
          d={penRect(x, 58 - h, w, h, i + 4, 0.4)}
          fill="var(--paper)"
        />
      ))}
      <path d="M52.5 16 v-8" />
      <path d={penLine(4, 58, 196, 59, 6)} />
      <path d="M120 54 L196 46 M120 56 Q150 50 164 18 M176 18 Q188 44 196 46" />
      <path d={penRect(164, 16, 12, 38, 9, 0.3)} />
      <path d={penLine(14, 70, 186, 70, 2)} opacity={0.4} />
      <path d={penLine(22, 82, 178, 82, 3)} opacity={0.4} />
      <path
        d="M60 76 L84 76 L81 81 L62 81 Z"
        fill="var(--accent)"
        stroke="var(--accent)"
      />
      <path d="M65 76 v-5 h13 v5" />
      <path d="M44 79 q3 -2 6 0 M34 80 q3 -2 6 0" opacity={0.6} />
    </>
  );
}

const TREE = (() => {
  let d = '';
  const branch = (
    x: number,
    y: number,
    dir: number,
    len: number,
    n: number,
  ) => {
    const x2 = x + Math.sin(dir) * len;
    const y2 = y - Math.cos(dir) * len;
    d += `M${x.toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} `;
    if (n === 0) return;
    branch(x2, y2, dir - 0.45, len * 0.72, n - 1);
    branch(x2, y2, dir + 0.45, len * 0.72, n - 1);
  };
  branch(100, 86, 0, 24, 6);
  return d;
})();

function TreeArt() {
  return (
    <>
      <path d={penLine(40, 86, 160, 87, 4)} />
      <path d={TREE} strokeWidth={0.9} />
    </>
  );
}
