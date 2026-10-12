import { FlowerHead } from './FlowerGlyph';
import {
  STUDIO_FLOWERS,
  getBloomLook,
  getRibbon,
  getRibbonStyle,
  getSize,
  getWrap,
  getWrapStyle,
  lighten,
  totalStems,
  type StudioFlower,
} from '../data/studio';

/**
 * Live bouquet preview — a flat, cute illustration (not a photo): the
 * chosen wrap style (cone / fan / basket / pleated) with a ribbon tied at
 * the waist, and the chosen flowers drawn as vector blooms with stems
 * gathered into the wrap. Re-renders instantly on every change. Used by
 * the Design Studio page (and later the cart).
 */

interface Props {
  qtys: Record<string, number>;
  wrapId: string;
  ribbonId: string;
  sizeId: string;
  wrapStyleId?: string;
  ribbonStyleId?: string;
  lookId?: string;
  /** Unique id prefix so multiple previews on a page don't collide on the
   * shared gradient id. */
  uid?: string;
  className?: string;
}

interface Pt { x: number; y: number; }

const CX = 200;
const CY = 152;

/**
 * Bloom placement in the dome above the wrap: outermost ring first,
 * center last (painter's order), so overlapping heads layer naturally.
 * `ringScale` grows the arrangement for larger sizes; the bloom look
 * spreads rings apart (airy) or packs them with bigger heads (full).
 */
function rosette(n: number, ringScale: number, ringFactor: number): Pt[] {
  const rf = ringScale * ringFactor;
  if (n <= 0) return [];
  if (n === 1) return [{ x: CX, y: CY }];
  if (n === 2) return [{ x: CX - 46 * ringFactor, y: CY + 4 }, { x: CX + 46 * ringFactor, y: CY + 4 }];
  if (n === 3) {
    return [
      { x: CX - 48 * ringFactor, y: CY + 38 * ringFactor },
      { x: CX + 48 * ringFactor, y: CY + 38 * ringFactor },
      { x: CX, y: CY - 42 * ringFactor },
    ];
  }
  const ring = (count: number, r: number, offset: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + offset + (i / count) * Math.PI * 2;
      pts.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r });
    }
    return pts;
  };
  if (n <= 7) {
    // center + one ring
    return [...ring(n - 1, 60 * rf, 0), { x: CX, y: CY }];
  }
  // 8–12: center + inner ring + outer ring (outer painted first)
  const rest = n - 1;
  const innerCount = Math.ceil(rest / 2);
  const outerCount = rest - innerCount;
  return [
    ...ring(outerCount, 92 * rf, Math.PI / Math.max(outerCount, 1)),
    ...ring(innerCount, 52 * rf, 0),
    { x: CX, y: CY },
  ];
}

// ── Wrap style geometry ─────────────────────────────────────────────────────

// Classic cone / pleated: elliptical rim at the top (front edge dipping
// down), sides curving into a soft point at the bottom.
const CONE =
  'M 70 226 Q 200 258 330 226 C 326 336 258 434 214 472 Q 200 486 186 472 C 142 434 74 336 70 226 Z';

// Pleat lines following the cone's taper.
const PLEATS = [
  'M 120 236 C 130 330 170 420 190 468',
  'M 165 252 C 170 340 188 420 197 474',
  'M 235 252 C 230 340 212 420 203 474',
  'M 280 236 C 270 330 230 420 210 468',
];

// Basket body (rim at y298, rounded taper to the base).
const BASKET_BODY =
  'M 88 298 C 92 390 128 458 160 482 Q 200 498 240 482 C 272 458 308 390 312 298 Z';

// Wide fan: seven paper blades gathered at a point below the blooms.
const FAN_GATHER = { x: 200, y: 505 };
const fanBlades = Array.from({ length: 7 }, (_, i) => {
  const a1 = ((55 + i * 10) * Math.PI) / 180;
  const a2 = ((65 + i * 10) * Math.PI) / 180;
  const am = (a1 + a2) / 2;
  const R = 280;
  return {
    x1: FAN_GATHER.x + Math.cos(a1) * R,
    y1: FAN_GATHER.y - Math.sin(a1) * R,
    x2: FAN_GATHER.x + Math.cos(a2) * R,
    y2: FAN_GATHER.y - Math.sin(a2) * R,
    mx: FAN_GATHER.x + Math.cos(am) * (R + 12),
    my: FAN_GATHER.y - Math.sin(am) * (R + 12),
    even: i % 2 === 0,
  };
});

export function BouquetPreview({
  qtys,
  wrapId,
  ribbonId,
  sizeId,
  wrapStyleId = 'cone',
  ribbonStyleId = 'bow',
  lookId = 'natural',
  uid = 'ds',
  className,
}: Props) {
  const wrap = getWrap(wrapId);
  const ribbon = getRibbon(ribbonId);
  const size = getSize(sizeId);
  const wrapStyle = getWrapStyle(wrapStyleId);
  const ribbonStyle = getRibbonStyle(ribbonStyleId);
  const look = getBloomLook(lookId);
  const stems = totalStems(qtys);
  const blooms = rosette(stems, size.ringScale, look.ringFactor);
  const r = size.flowerR * look.headFactor;

  // Slots in paint order (outer ring first). Chosen stems are expanded into
  // slots in palette order so mixed bouquets distribute naturally.
  const paint = blooms.map((p, i) => ({ ...p, i }));
  const slotFlowers: StudioFlower[] = [];
  for (const f of STUDIO_FLOWERS) {
    const q = qtys[f.id] || 0;
    for (let k = 0; k < q; k++) slotFlowers.push(f);
  }

  // Where the stems gather and where the ribbon sits, per wrap style.
  const gatherY = wrapStyle.id === 'fan' ? 300 : wrapStyle.id === 'basket' ? 330 : 272;
  const anchor =
    wrapStyle.id === 'fan'
      ? { x: 200, y: 492, halfTop: 26, halfBot: 22, s: 0.52 }
      : wrapStyle.id === 'basket'
        ? { x: 200, y: 440, halfTop: 58, halfBot: 50, s: 0.85 }
        : { x: 200, y: 414, halfTop: 80, halfBot: 62, s: 1 };
  const shadowCy = wrapStyle.id === 'fan' ? 528 : wrapStyle.id === 'basket' ? 508 : 500;

  // ── Ribbon (style-aware, drawn at the anchor) ──
  const { x: ax, y: ay, halfTop, halfBot, s } = anchor;
  const ribbonParts = (
    <g>
      {/* Waist band */}
      <path
        d={`M ${ax - halfTop} ${ay - 24} Q ${ax} ${ay - 6} ${ax + halfTop} ${ay - 24} L ${ax + halfBot} ${ay + 14} Q ${ax} ${ay + 32} ${ax - halfBot} ${ay + 14} Z`}
        fill={ribbon.hex}
      />
      <path
        d={`M ${ax - halfTop} ${ay - 24} Q ${ax} ${ay - 6} ${ax + halfTop} ${ay - 24} L ${ax + halfTop - 4} ${ay - 12} Q ${ax} ${ay + 6} ${ax - halfTop + 4} ${ay - 12} Z`}
        fill={ribbon.shade}
        opacity="0.45"
      />

      {ribbonStyle.id === 'tie' ? (
        <>
          {/* Simple tie: knot with long crossed tails, no loops */}
          <path
            d={`M ${ax - 6} ${ay + 10} C ${ax - 12} ${ay + 36} ${ax - 18} ${ay + 58} ${ax - 26 * s - 10} ${ay + 82 * s}`}
            stroke={ribbon.hex}
            strokeWidth={9 * s + 2}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${ax + 6} ${ay + 10} C ${ax + 12} ${ay + 36} ${ax + 18} ${ay + 58} ${ax + 26 * s + 10} ${ay + 82 * s}`}
            stroke={ribbon.shade}
            strokeWidth={9 * s + 2}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={ax} cy={ay + 4} r={10 * s + 2} fill={ribbon.shade} />
          <circle cx={ax} cy={ay + 4} r={6 * s + 2} fill={ribbon.hex} />
        </>
      ) : (
        <>
          {/* Short tails */}
          <path
            d={`M ${ax - 9} ${ay + 18} C ${ax - 14} ${ay + 34} ${ax - 19} ${ay + 50} ${ax - 24} ${ay + 66 * s + 14}`}
            stroke={ribbon.hex}
            strokeWidth={10 * s + 2}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${ax + 9} ${ay + 18} C ${ax + 14} ${ay + 34} ${ax + 19} ${ay + 50} ${ax + 24} ${ay + 66 * s + 14}`}
            stroke={ribbon.shade}
            strokeWidth={10 * s + 2}
            strokeLinecap="round"
            fill="none"
          />
          {ribbonStyle.id === 'loop' && (
            <>
              {/* Second, smaller loop stacked above each main loop */}
              <ellipse cx={ax - 33 * s} cy={ay - 15 * s} rx={17 * s} ry={11 * s} fill={ribbon.hex} transform={`rotate(-22 ${ax - 33 * s} ${ay - 15 * s})`} />
              <ellipse cx={ax + 33 * s} cy={ay - 15 * s} rx={17 * s} ry={11 * s} fill={ribbon.hex} transform={`rotate(22 ${ax + 33 * s} ${ay - 15 * s})`} />
            </>
          )}
          {/* Main loops */}
          <ellipse cx={ax - 30 * s} cy={ay} rx={25 * s} ry={17 * s} fill={ribbon.hex} transform={`rotate(-14 ${ax - 30 * s} ${ay})`} />
          <ellipse cx={ax + 30 * s} cy={ay} rx={25 * s} ry={17 * s} fill={ribbon.hex} transform={`rotate(14 ${ax + 30 * s} ${ay})`} />
          <ellipse cx={ax - 30 * s} cy={ay} rx={13 * s} ry={8 * s} fill={ribbon.shade} opacity="0.35" transform={`rotate(-14 ${ax - 30 * s} ${ay})`} />
          <ellipse cx={ax + 30 * s} cy={ay} rx={13 * s} ry={8 * s} fill={ribbon.shade} opacity="0.35" transform={`rotate(14 ${ax + 30 * s} ${ay})`} />
          {/* Knot */}
          <circle cx={ax} cy={ay + 4} r={11 * s + 2} fill={ribbon.shade} />
          <circle cx={ax} cy={ay + 4} r={7 * s + 2} fill={ribbon.hex} />
        </>
      )}
    </g>
  );

  return (
    <svg
      viewBox="0 0 400 560"
      className={className}
      role="img"
      aria-label={`Bouquet preview: ${stems} stem${stems === 1 ? '' : 's'}, ${wrapStyle.name} in ${wrap.name}, ${ribbonStyle.name} in ${ribbon.name}, ${look.name} blooms, ${size.name} size`}
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF2F6" />
        </radialGradient>
      </defs>

      {/* Backdrop */}
      <rect width="400" height="560" rx="28" fill={`url(#${uid}-bg)`} />

      {/* Ground shadow */}
      <ellipse cx="200" cy={shadowCy} rx={78} ry={11} fill="#000000" opacity="0.06" />

      {/* ── Wrap, back layer (behind stems & blooms) ── */}
      {wrapStyle.id === 'basket' && (
        /* Basket handle arcs behind the flowers */
        <path d="M 118 302 C 116 160 284 160 282 302" stroke={wrap.shade} strokeWidth="12" strokeLinecap="round" fill="none" />
      )}
      {wrapStyle.id === 'cone' || wrapStyle.id === 'pleated' ? (
        /* Lining: inside of the cone, visible behind the blooms */
        <ellipse cx="200" cy="226" rx="130" ry="30" fill={lighten(wrap.hex, 0.5)} />
      ) : null}

      {/* Leaves peeking out at the sides of the dome */}
      {stems >= 3 && (
        <g fill="#8FB08A">
          <ellipse cx="132" cy="222" rx="28" ry="12" transform="rotate(-40 132 222)" />
          <ellipse cx="270" cy="226" rx="28" ry="12" transform="rotate(36 270 226)" />
        </g>
      )}

      {/* Stems — gathered down into the wrap, behind the blooms */}
      {stems >= 1 && (
        <g stroke="#79A86F" strokeWidth="6" strokeLinecap="round" fill="none">
          {paint.map(p => {
            const ctrlX = (p.x + 200) / 2 + (p.x - 200) * 0.15;
            return <path key={p.i} d={`M ${p.x} ${p.y} Q ${ctrlX} ${(p.y + gatherY) / 2} 200 ${gatherY}`} />;
          })}
        </g>
      )}

      {/* ── Wrap, front layer (over the stems) ── */}
      {wrapStyle.id === 'fan' && (
        /* Fan blades gathered below, covering the stem ends */
        <g>
          {fanBlades.map((b, i) => (
            <path
              key={i}
              d={`M ${FAN_GATHER.x} ${FAN_GATHER.y} L ${b.x1} ${b.y1} Q ${b.mx} ${b.my} ${b.x2} ${b.y2} Z`}
              fill={b.even ? wrap.hex : wrap.shade}
              opacity={b.even ? 1 : 0.6}
            />
          ))}
          {/* Gathered base */}
          <path d="M 186 480 L 214 480 L 210 528 Q 200 536 190 528 Z" fill={wrap.shade} />
        </g>
      )}
      {wrapStyle.id === 'basket' && (
        <g>
          {/* Rim lining then basket body over the stem ends */}
          <ellipse cx="200" cy="298" rx="114" ry="20" fill={lighten(wrap.hex, 0.5)} />
          <path d={BASKET_BODY} fill={wrap.hex} />
          {/* Weave */}
          <g stroke={wrap.shade} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4">
            <path d="M 96 352 Q 200 374 304 352" />
            <path d="M 112 408 Q 200 430 288 408" />
            <path d="M 132 308 C 128 380 142 430 160 468" />
            <path d="M 200 310 C 200 380 200 430 200 480" />
            <path d="M 268 308 C 272 380 258 430 240 468" />
          </g>
        </g>
      )}
      {(wrapStyle.id === 'cone' || wrapStyle.id === 'pleated') && (
        <>
          <path d={CONE} fill={wrap.hex} />
          <path d="M 200 254 C 199 330 199 410 200 470" stroke="#000000" strokeOpacity="0.06" strokeWidth="3" fill="none" />
          {wrapStyle.id === 'pleated' && (
            <g stroke={wrap.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45">
              {PLEATS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          )}
        </>
      )}

      {/* Blooms — outermost first, center last */}
      {paint.map(p => {
        const flower = slotFlowers[p.i] || STUDIO_FLOWERS[0];
        const rot = (p.i * 53) % 360;
        return (
          <g key={p.i} transform={`translate(${p.x} ${p.y}) rotate(${rot})`}>
            <FlowerHead species={flower.id} r={r} />
          </g>
        );
      })}

      {/* Empty state hint */}
      {stems === 0 && (
        <>
          <text x="200" y="156" textAnchor="middle" fontSize="15" fill="#D8A9B8" fontFamily="inherit">
            Add flowers to see
          </text>
          <text x="200" y="178" textAnchor="middle" fontSize="15" fill="#D8A9B8" fontFamily="inherit">
            your bouquet take shape
          </text>
        </>
      )}

      {/* Ribbon */}
      {ribbonParts}
    </svg>
  );
}
