/**
 * Flat illustrated flower glyphs in the style of bouquet-builder UIs —
 * cute vector blooms (no photos). `FlowerHead` draws just the bloom at the
 * current SVG origin (used inside the Design Studio preview), `FlowerGlyph`
 * draws the full mini flower — bloom + stem + leaves — for picker chips.
 * Species ids match STUDIO_FLOWERS ids in data/studio.ts.
 */

interface Palette {
  main: string;
  deep: string;
  light: string;
  dot: string;
}

const PALETTES: Record<string, Palette> = {
  rose: { main: '#E04A63', deep: '#C1324B', light: '#F08098', dot: '#FFE1E8' },
  tulip: { main: '#EF6D97', deep: '#D4507C', light: '#F7A2BF', dot: '#FBD3DF' },
  sunflower: { main: '#F6C53F', deep: '#DFA624', light: '#FBD878', dot: '#8C5A32' },
  orchid: { main: '#B07CE8', deep: '#8F5BCE', light: '#CCABF4', dot: '#FFFFFF' },
  lily: { main: '#FBE6B0', deep: '#EDD083', light: '#FDF2D4', dot: '#E8A33C' },
  peony: { main: '#F291B8', deep: '#DC6F9E', light: '#F9BBD3', dot: '#FFE1EC' },
  carnation: { main: '#F49AB0', deep: '#DE7A95', light: '#FBC3D1', dot: '#FFE7EE' },
  'babys-breath': { main: '#FFFFFF', deep: '#E4DCE8', light: '#FFFFFF', dot: '#F5CE62' },
  default: { main: '#F2879B', deep: '#DE6480', light: '#FAB6C6', dot: '#FFE1EC' },
};

export const getFlowerColor = (species: string) => (PALETTES[species] ?? PALETTES.default).main;

const ring = (n: number, radius: number, offsetDeg = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (offsetDeg * Math.PI) / 180 + (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });

/** The bloom only — centered at (0,0), radius `r`. */
export function FlowerHead({ species, r }: { species: string; r: number }) {
  const p = PALETTES[species] ?? PALETTES.default;

  switch (species) {
    case 'rose':
      return (
        <g>
          {ring(7, r * 0.66).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.42} fill={p.main} />
          ))}
          <circle r={r * 0.74} fill={p.main} />
          <circle r={r * 0.48} fill={p.deep} />
          <circle r={r * 0.26} fill={p.light} />
          <circle r={r * 0.1} fill={p.dot} />
        </g>
      );

    case 'tulip':
      return (
        <g>
          <ellipse cx={-r * 0.46} cy={r * 0.05} rx={r * 0.44} ry={r * 0.8} fill={p.deep} transform={`rotate(-14 ${-r * 0.46} ${r * 0.05})`} />
          <ellipse cx={r * 0.46} cy={r * 0.05} rx={r * 0.44} ry={r * 0.8} fill={p.deep} transform={`rotate(14 ${r * 0.46} ${r * 0.05})`} />
          <ellipse cx={0} cy={-r * 0.08} rx={r * 0.52} ry={r * 0.9} fill={p.main} />
          <ellipse cx={0} cy={r * 0.08} rx={r * 0.24} ry={r * 0.5} fill={p.light} />
        </g>
      );

    case 'sunflower':
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse
              key={i}
              cx={0}
              cy={-r * 0.6}
              rx={r * 0.19}
              ry={r * 0.42}
              fill={i % 2 === 0 ? p.main : p.light}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <circle r={r * 0.44} fill={p.dot} />
          <circle r={r * 0.3} fill="#A9743F" />
        </g>
      );

    case 'orchid':
      return (
        <g>
          {ring(4, r * 0.5, 45).map((pt, i) => (
            <ellipse key={i} cx={pt.x} cy={pt.y} rx={r * 0.46} ry={r * 0.38} fill={i === 0 ? p.light : p.main} transform={`rotate(${45 + i * 90} ${pt.x} ${pt.y})`} />
          ))}
          <circle r={r * 0.26} fill={p.light} />
          <circle cy={r * 0.06} r={r * 0.12} fill={p.deep} />
        </g>
      );

    case 'lily':
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d={`M 0 0 Q ${r * 0.32} ${-r * 0.5} 0 ${-r} Q ${-r * 0.32} ${-r * 0.5} 0 0 Z`}
              fill={i % 2 === 0 ? p.main : p.light}
              transform={`rotate(${i * 60})`}
            />
          ))}
          {ring(3, r * 0.26, -90).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.08} fill={p.dot} />
          ))}
        </g>
      );

    case 'peony':
      return (
        <g>
          {ring(10, r * 0.7).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.38} fill={p.light} />
          ))}
          {ring(7, r * 0.44).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.34} fill={p.main} />
          ))}
          <circle r={r * 0.3} fill={p.light} />
          <circle r={r * 0.12} fill={p.deep} />
        </g>
      );

    case 'carnation':
      return (
        <g>
          {ring(9, r * 0.62).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.4} fill={p.main} />
          ))}
          <circle r={r * 0.72} fill={p.main} />
          {ring(6, r * 0.32).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.28} fill={p.light} />
          ))}
          <circle r={r * 0.22} fill={p.main} />
        </g>
      );

    case 'babys-breath': {
      const spots = [
        { x: 0, y: 0 },
        ...ring(5, r * 0.58, -90),
      ];
      return (
        <g>
          <ellipse cx={-r * 0.5} cy={r * 0.42} rx={r * 0.26} ry={r * 0.13} fill="#8FB08A" transform={`rotate(-30 ${-r * 0.5} ${r * 0.42})`} />
          <ellipse cx={r * 0.52} cy={r * 0.4} rx={r * 0.26} ry={r * 0.13} fill="#8FB08A" transform={`rotate(28 ${r * 0.52} ${r * 0.4})`} />
          {spots.map((s, i) => (
            <g key={i} transform={`translate(${s.x} ${s.y})`}>
              {ring(5, r * 0.17, -90).map((pt, j) => (
                <circle key={j} cx={pt.x} cy={pt.y} r={r * 0.13} fill={p.main} stroke={p.deep} strokeWidth={r * 0.03} />
              ))}
              <circle r={r * 0.08} fill={p.dot} />
            </g>
          ))}
        </g>
      );
    }

    default:
      // Generic 5-petal fallback
      return (
        <g>
          {ring(5, r * 0.58, -90).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={r * 0.4} fill={p.main} />
          ))}
          <circle r={r * 0.3} fill={p.light} />
          <circle r={r * 0.12} fill={p.dot} />
        </g>
      );
  }
}

/** Full mini flower (bloom + stem + leaves) for picker chips. */
export function FlowerGlyph({ species, className }: { species: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M 32 32 C 31 41 31 49 32 56" stroke="#79A86F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="45" rx="9" ry="5" fill="#8FB08A" transform="rotate(-28 22 45)" />
      <ellipse cx="43" cy="49" rx="9" ry="5" fill="#8FB08A" transform="rotate(26 43 49)" />
      <g transform="translate(32 25)">
        <FlowerHead species={species} r={15} />
      </g>
    </svg>
  );
}
