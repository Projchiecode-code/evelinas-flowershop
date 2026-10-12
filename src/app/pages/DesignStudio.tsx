import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Minus, Plus, Sparkles, RotateCcw, Info, Palette, Flower2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { BouquetPreview } from '../components/BouquetPreview';
import { FlowerGlyph } from '../components/FlowerGlyph';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/currency';
import { Bouquet, BouquetCustomization } from '../types';
import {
  MAX_STEMS,
  RIBBON_COLORS,
  RIBBON_STYLES,
  SIZES,
  BLOOM_LOOKS,
  STUDIO_FLOWERS,
  WRAP_COLORS,
  WRAP_STYLES,
  flowerPhoto,
  flowerSummary,
  getBloomLook,
  getSize,
  getRibbon,
  getRibbonStyle,
  getWrap,
  getWrapStyle,
  stemsSubtotal,
  studioPrice,
  totalStems,
} from '../data/studio';

/**
 * Design Studio — pick flowers, wrapper, ribbon and size while a stylized
 * SVG preview updates instantly, so the customer can visualize the final
 * bouquet before ordering. Pricing = per-stem × size multiplier.
 */
export function DesignStudio() {
  const { addToCart } = useCart();
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [wrapId, setWrapId] = useState('blush');
  const [ribbonId, setRibbonId] = useState('gold');
  const [sizeId, setSizeId] = useState('medium');
  const [wrapStyleId, setWrapStyleId] = useState('cone');
  const [ribbonStyleId, setRibbonStyleId] = useState('bow');
  const [lookId, setLookId] = useState('natural');

  const stems = totalStems(qtys);
  const price = studioPrice(qtys, sizeId);
  const size = getSize(sizeId);
  const wrap = getWrap(wrapId);
  const ribbon = getRibbon(ribbonId);
  const wrapStyle = getWrapStyle(wrapStyleId);
  const ribbonStyle = getRibbonStyle(ribbonStyleId);
  const look = getBloomLook(lookId);

  const lines = useMemo(
    () => STUDIO_FLOWERS.filter(f => (qtys[f.id] || 0) > 0).map(f => ({ ...f, qty: qtys[f.id] })),
    [qtys],
  );

  const bump = (id: string, delta: number) => {
    setQtys(prev => {
      // Cap against the *current* totals — checking the render-time value
      // would let fast repeated taps push the bouquet past MAX_STEMS.
      if (delta > 0 && totalStems(prev) >= MAX_STEMS) return prev;
      return { ...prev, [id]: Math.max(0, prev[id] || 0) + delta };
    });
  };

  const reset = () => {
    setQtys({});
    setWrapId('blush');
    setRibbonId('gold');
    setSizeId('medium');
    setWrapStyleId('cone');
    setRibbonStyleId('bow');
    setLookId('natural');
  };

  /** Package the design as a custom cart item — the full spec rides along. */
  const handleSave = () => {
    if (stems === 0) return;
    const flowerQtys: Record<string, number> = {};
    for (const l of lines) flowerQtys[l.id] = l.qty;
    const customization: BouquetCustomization = {
      flowers: flowerQtys,
      wrapStyle: wrapStyleId,
      wrapColor: wrapId,
      ribbonStyle: ribbonStyleId,
      ribbonColor: ribbonId,
      size: sizeId,
      look: lookId,
    };
    // Each design is its own cart line (custom ids never merge), so a
    // customer can order several different designs at once.
    const bouquet: Bouquet = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: `Custom ${size.name} Bouquet`,
      description: `Designed in the Studio — ${flowerSummary(flowerQtys)}. ${wrapStyle.name} wrap in ${wrap.name}, ${ribbonStyle.name} ribbon in ${ribbon.name}.`,
      price,
      image: flowerPhoto(lines[0]?.id || ''),
      category: 'Custom Design',
      occasion: [],
      popularity: 0,
      inStock: true,
      stock: Number.MAX_SAFE_INTEGER,
      flowers: lines.map(l => l.name),
    };
    addToCart(bouquet, 1, undefined, undefined, customization);
    toast.success('Added to cart — your custom design is ready for checkout!');
  };

  return (
    <div className="min-h-screen bg-rose-50/60">
      {/* Header */}
      <section className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white">
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Palette className="w-8 h-8 text-yellow-300" /> Design Your Own Bouquet
          </h1>
          <p className="text-rose-100 max-w-2xl mx-auto">
            Choose your flowers, wrapper, ribbon and size — the preview updates as you go, so you can
            see your bouquet before you order.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Preview (left, sticky on desktop) ── */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-4 sm:p-6">
              <BouquetPreview
                qtys={qtys}
                wrapId={wrapId}
                ribbonId={ribbonId}
                sizeId={sizeId}
                wrapStyleId={wrapStyleId}
                ribbonStyleId={ribbonStyleId}
                lookId={lookId}
                className="w-full h-auto rounded-2xl"
              />

              {/* Price + summary strip */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Estimated total</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(price)}
                    <span className="text-sm font-medium text-gray-400 ml-2">
                      {stems} stem{stems === 1 ? '' : 's'} · {size.name}
                    </span>
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400 leading-relaxed">
                  <p>{stemsSubtotal(qtys) > 0 ? `${formatCurrency(stemsSubtotal(qtys))} stems × ${size.multiplier}` : 'Add flowers to price it'}</p>
                  <p>{wrapStyle.name} · {wrap.name} wrap</p>
                  <p>{ribbonStyle.name} · {ribbon.name} ribbon</p>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-400">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Illustration of your choices — the finished bouquet is handcrafted, so it may vary
                slightly from the preview.
              </p>
            </div>
          </div>

          {/* ── Controls (right) ── */}
          <div className="space-y-6">
            {/* Flowers */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-rose-500" /> Pick your flowers
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stems >= MAX_STEMS ? 'bg-amber-100 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>
                  {stems}/{MAX_STEMS} stems
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Tap a flower to add stems — price updates live.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STUDIO_FLOWERS.map(f => {
                  const qty = qtys[f.id] || 0;
                  return (
                    <div
                      key={f.id}
                      className={`rounded-2xl border p-3 text-center transition-all ${
                        qty > 0 ? 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-300' : 'border-pink-100 hover:border-rose-200'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ring-2 transition-all ${
                          qty > 0 ? 'bg-white ring-rose-300' : 'bg-rose-50/70 ring-pink-100'
                        }`}
                      >
                        <FlowerGlyph species={f.id} className="w-11 h-11" />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-800">{f.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(f.price)}/stem</p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => bump(f.id, -1)}
                          disabled={qty === 0}
                          aria-label={`Remove a ${f.name}`}
                          className="w-7 h-7 rounded-full border border-pink-200 text-gray-500 flex items-center justify-center hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-gray-800">{qty}</span>
                        <button
                          onClick={() => bump(f.id, 1)}
                          disabled={stems >= MAX_STEMS}
                          aria-label={`Add a ${f.name}`}
                          className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-30 disabled:hover:bg-rose-500 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wrapper */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">Wrapper style</h2>
              <p className="text-sm text-gray-500 mb-3">Currently: <span className="font-semibold text-rose-600">{wrapStyle.name}</span></p>
              <div className="grid grid-cols-4 gap-2">
                {WRAP_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setWrapStyleId(s.id)}
                    className={`rounded-2xl border px-1 py-2.5 text-center transition-all ${
                      wrapStyleId === s.id ? 'border-rose-400 bg-rose-50/60 text-rose-600 ring-1 ring-rose-300' : 'border-pink-100 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    <WrapIcon style={s.id} className="w-7 h-7 mx-auto" />
                    <p className="mt-1 text-xs font-semibold leading-tight">{s.name}</p>
                  </button>
                ))}
              </div>

              <h2 className="font-bold text-gray-800 mt-5 mb-1">Wrapper color</h2>
              <p className="text-sm text-gray-500 mb-3">Currently: <span className="font-semibold text-rose-600">{wrap.name}</span></p>
              <div className="flex flex-wrap gap-3">
                {WRAP_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setWrapId(c.id)}
                    title={c.name}
                    aria-label={`Wrapper: ${c.name}`}
                    className={`w-10 h-10 rounded-full border transition-transform hover:scale-110 ${
                      wrapId === c.id ? 'ring-2 ring-rose-500 ring-offset-2 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Ribbon */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">Ribbon style</h2>
              <p className="text-sm text-gray-500 mb-3">Currently: <span className="font-semibold text-rose-600">{ribbonStyle.name}</span></p>
              <div className="grid grid-cols-3 gap-2">
                {RIBBON_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setRibbonStyleId(s.id)}
                    className={`rounded-2xl border px-1 py-2.5 text-center transition-all ${
                      ribbonStyleId === s.id ? 'border-rose-400 bg-rose-50/60 text-rose-600 ring-1 ring-rose-300' : 'border-pink-100 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    <RibbonIcon style={s.id} className="w-7 h-7 mx-auto" />
                    <p className="mt-1 text-xs font-semibold leading-tight">{s.name}</p>
                  </button>
                ))}
              </div>

              <h2 className="font-bold text-gray-800 mt-5 mb-1">Ribbon color</h2>
              <p className="text-sm text-gray-500 mb-3">Currently: <span className="font-semibold text-rose-600">{ribbon.name}</span></p>
              <div className="flex flex-wrap gap-3">
                {RIBBON_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setRibbonId(c.id)}
                    title={c.name}
                    aria-label={`Ribbon: ${c.name}`}
                    className={`w-10 h-10 rounded-full border transition-transform hover:scale-110 ${
                      ribbonId === c.id ? 'ring-2 ring-rose-500 ring-offset-2 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Bloom look */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">Bloom look</h2>
              <p className="text-sm text-gray-500 mb-3">How full and close the flowers sit together.</p>
              <div className="grid grid-cols-3 gap-2">
                {BLOOM_LOOKS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLookId(l.id)}
                    className={`rounded-2xl border px-1 py-2.5 text-center transition-all ${
                      lookId === l.id ? 'border-rose-400 bg-rose-50/60 text-rose-600 ring-1 ring-rose-300' : 'border-pink-100 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    <LookIcon look={l.id} className="w-7 h-7 mx-auto" />
                    <p className="mt-1 text-xs font-semibold leading-tight">{l.name}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{l.tag}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">Bouquet size</h2>
              <p className="text-sm text-gray-500 mb-4">Bigger sizes use more blooms — multiplier applies to the stem total.</p>
              <div className="grid grid-cols-3 gap-2 bg-rose-50 rounded-2xl p-1.5">
                {SIZES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={`rounded-xl py-3 text-center transition-all ${
                      sizeId === s.id
                        ? 'bg-white shadow text-rose-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs">{s.tag} · ×{s.multiplier}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-3">Your bouquet</h2>
              {lines.length === 0 ? (
                <p className="text-sm text-gray-400">No flowers yet — add stems above to start your arrangement.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {lines.map(l => (
                    <li key={l.id} className="flex justify-between text-gray-600">
                      <span>{l.qty}× {l.name} <span className="text-gray-400">({formatCurrency(l.price)}/stem)</span></span>
                      <span className="font-medium">{formatCurrency(l.qty * l.price)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-gray-600 border-t border-pink-100 pt-2">
                    <span>Size — {size.name} (×{size.multiplier})</span>
                    <span className="font-medium">{formatCurrency(price)}</span>
                  </li>
                  <li className="flex justify-between text-gray-600">
                    <span>Wrap — {wrapStyle.name}, {wrap.name}</span>
                  </li>
                  <li className="flex justify-between text-gray-600">
                    <span>Ribbon — {ribbonStyle.name}, {ribbon.name} · Blooms — {look.name}</span>
                  </li>
                </ul>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={
                    stems === 0 &&
                    wrapId === 'blush' &&
                    ribbonId === 'gold' &&
                    sizeId === 'medium' &&
                    wrapStyleId === 'cone' &&
                    ribbonStyleId === 'bow' &&
                    lookId === 'natural'
                  }
                  className="border-gray-200 text-gray-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button
                  className="bg-gradient-to-r from-rose-500 to-purple-500 text-white flex-1 sm:flex-none"
                  disabled={stems === 0}
                  onClick={handleSave}
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Add to Cart — {formatCurrency(price)}
                </Button>
              </div>
              {stems === 0 && (
                <p className="mt-2 text-xs text-rose-500">Add at least one flower to save your design.</p>
              )}

              <p className="mt-4 text-xs text-gray-400">
                Want inspiration first? Browse the <Link to="/catalog" className="text-rose-600 hover:underline">catalog</Link> or try{' '}
                <Link to="/recommendations" className="text-rose-600 hover:underline">AI Picks</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mini icons for the style pickers � flat, matching the preview drawings. */
function WrapIcon({ style, className }: { style: string; className?: string }) {
  if (style === 'fan') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M12 21 L3.5 10.5 L7 6 Z" fill="currentColor" opacity="0.6" />
        <path d="M12 21 L8.5 5 L15.5 5 Z" fill="currentColor" />
        <path d="M12 21 L20.5 10.5 L17 6 Z" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  if (style === 'basket') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M9 11 a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M5 11 h14 l-2 8 h-10 z" fill="currentColor" />
      </svg>
    );
  }
  if (style === 'pleated') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M5 6 h14 l-6 14 h-2 z" fill="currentColor" opacity="0.65" />
        <path d="M9.6 6.5 L10.9 19 M14.4 6.5 L13.1 19" stroke="currentColor" strokeWidth="1.4" opacity="0.95" />
      </svg>
    );
  }
  // cone
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 6 h14 l-6.5 14 h-1 z" fill="currentColor" />
    </svg>
  );
}

function RibbonIcon({ style, className }: { style: string; className?: string }) {
  if (style === 'tie') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M10 13.5 L7 21 M14 13.5 L17 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="3" y="9" width="18" height="4.5" rx="2" fill="currentColor" />
        <circle cx="12" cy="11.2" r="3.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {style === 'loop' && (
        <>
          <circle cx="5.5" cy="4.8" r="2.6" fill="currentColor" opacity="0.65" />
          <circle cx="18.5" cy="4.8" r="2.6" fill="currentColor" opacity="0.65" />
        </>
      )}
      <circle cx="6.5" cy="12" r="4" fill="currentColor" />
      <circle cx="17.5" cy="12" r="4" fill="currentColor" />
      <circle cx="12" cy="13.4" r="3.4" fill="currentColor" />
    </svg>
  );
}

function LookIcon({ look, className }: { look: string; className?: string }) {
  if (look === 'full') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="8" cy="10" r="4.4" fill="currentColor" />
        <circle cx="15" cy="9" r="4.4" fill="currentColor" opacity="0.8" />
        <circle cx="11.5" cy="15" r="4.4" fill="currentColor" opacity="0.9" />
        <circle cx="17" cy="14.5" r="3.6" fill="currentColor" opacity="0.65" />
      </svg>
    );
  }
  if (look === 'airy') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="5.5" cy="6.5" r="2.6" fill="currentColor" />
        <circle cx="17.5" cy="7.5" r="2.6" fill="currentColor" opacity="0.8" />
        <circle cx="7" cy="17" r="2.6" fill="currentColor" opacity="0.9" />
        <circle cx="17" cy="16.5" r="2.6" fill="currentColor" opacity="0.65" />
      </svg>
    );
  }
  // natural
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="7.5" cy="9" r="3.4" fill="currentColor" />
      <circle cx="15" cy="7.8" r="3.4" fill="currentColor" opacity="0.8" />
      <circle cx="10.5" cy="15.5" r="3.4" fill="currentColor" opacity="0.9" />
      <circle cx="17" cy="14" r="2.9" fill="currentColor" opacity="0.65" />
    </svg>
  );
}
