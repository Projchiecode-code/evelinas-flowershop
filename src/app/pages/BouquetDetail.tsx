import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ShoppingCart, Heart, ArrowLeft, Package, Truck, CheckCircle, Star, Camera, Send, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { BouquetCard } from '../components/BouquetCard';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useOrders } from '../contexts/OrderContext';
import { useReviews } from '../contexts/ReviewsContext';
import { useGallery } from '../contexts/GalleryContext';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import { AIRecommendationEngine, buildSignals } from '../utils/aiRecommendations';
import { recordView, getRecentViews } from '../utils/viewHistory';
import { toast } from 'sonner';
import { compressImage } from '../utils/imageCompress';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)} onMouseEnter={() => onChange && setHover(n)} onMouseLeave={() => onChange && setHover(0)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-5 h-5 transition-colors ${(onChange ? (hover || value) : value) >= n ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

export function BouquetDetail() {
  const { bouquets, isLoading } = useProducts();
  const { id } = useParams();
  const bouquet = bouquets.find(b => b.id === id);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const { getReviewsForBouquet, getApprovedReviews, addReview } = useReviews();
  const { orders } = useOrders();
  const { getApprovedPhotos } = useGallery();
  const { user } = useAuth();

  // Remember this page view — it feeds the "similar to what you browsed"
  // signal used by recommendations across the site.
  useEffect(() => {
    if (bouquet) recordView(bouquet.id);
  }, [bouquet]);

  const [quantity, setQuantity] = useState(1);
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'gallery'>('details');

  // A deep link (or a link from an order) renders before GET /products
  // resolves — show a spinner rather than flashing "Bouquet not found".
  if (isLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
      </div>
    );
  }

  if (!bouquet) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Bouquet not found</h2>
          <Link to="/catalog"><Button className="bg-rose-500 text-white">Back to Catalog</Button></Link>
        </div>
      </div>
    );
  }

  const reviews = getReviewsForBouquet(bouquet.id);
  const galleryPhotos = getApprovedPhotos().filter(p => p.bouquetId === bouquet.id);
  // Live signals for the similar row: real star ratings, this shopper's view
  // history, their order history, and their favourites.
  const signals = buildSignals({
    reviews: getApprovedReviews(),
    viewedIds: getRecentViews(),
    orders,
    favoriteCategories: favorites.map(f => f.category),
  });
  const similarBouquets = AIRecommendationEngine.getSimilarBouquets(bouquet.id, 4, signals);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const fav = isFavorite(bouquet.id);
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  // Units left to buy — 0 means the CTA below already reads "Out of Stock".
  const maxStock = Math.max(1, bouquet.stock);

  const handleAddToCart = () => {
    // Never let a stale quantity (e.g. stock dropped while this page was open)
    // reach the cart — the server would only reject it at checkout anyway.
    const qty = Math.min(quantity, maxStock);
    addToCart(bouquet, qty, customMessage, deliveryDate);
    toast.success(`${bouquet.name} added to cart!`);
  };

  const handleHeart = () => {
    toggleFavorite(bouquet);
    toast.success(fav ? 'Removed from favorites' : 'Added to favorites!');
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Server allows 5 photos; each is compressed in the browser before upload.
    const room = 5 - reviewPhotos.length;
    if (files.length > room) toast.error('You can attach up to 5 photos');
    const chosen = files.slice(0, Math.max(0, room));
    if (chosen.length === 0) { if (e.target) e.target.value = ''; return; }
    setProcessingPhotos(true);
    try {
      const processed: string[] = [];
      for (const file of chosen) {
        if (file.size > 15 * 1024 * 1024) { toast.error('Each photo must be under 15 MB'); continue; }
        try {
          processed.push(await compressImage(file));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Could not process ${file.name}`);
        }
      }
      if (processed.length) setReviewPhotos(prev => [...prev, ...processed]);
    } finally {
      setProcessingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) { toast.error('Please select a rating'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a review'); return; }
    addReview({ bouquetId: bouquet.id, customerName: user?.name || 'Anonymous', customerEmail: user?.email, rating: reviewRating, comment: reviewComment, photos: reviewPhotos.length ? reviewPhotos : undefined });
    toast.success('Review submitted! It will appear after moderation.');
    setReviewRating(0);
    setReviewComment('');
    setReviewPhotos([]);
  };

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/catalog" className="inline-flex items-center text-rose-600 hover:underline mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg">
            <img src={bouquet.image} alt={bouquet.name} className="w-full h-[480px] object-cover" />
            {bouquet.popularity > 90 && (
              <Badge className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-sm px-3 py-1">⭐ Best Seller</Badge>
            )}
            {avgRating > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <Badge className="mb-2 bg-purple-100 text-purple-700 border-purple-200">{bouquet.category}</Badge>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{bouquet.name}</h1>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-rose-600">{formatCurrency(bouquet.price)}</p>
                {avgRating > 0 && <div className="flex items-center gap-1"><StarRating value={Math.round(avgRating)} /><span className="text-sm text-gray-500">({reviews.length})</span></div>}
              </div>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed">{bouquet.description}</p>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Flowers Included</h3>
              <div className="flex flex-wrap gap-2">
                {bouquet.flowers.map(f => <Badge key={f} className="bg-rose-100 text-rose-700 border-rose-200">🌸 {f}</Badge>)}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Perfect For</h3>
              <div className="flex flex-wrap gap-2">
                {bouquet.occasion.map(o => <Badge key={o} className="bg-purple-100 text-purple-700 border-purple-200">{o}</Badge>)}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label className="font-semibold text-gray-800 mb-2 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-xl border border-pink-200 text-gray-700 font-bold hover:border-rose-400 hover:bg-rose-50 transition-all">−</button>
                <span className="w-10 text-center font-bold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock}
                  className="w-9 h-9 rounded-xl border border-pink-200 text-gray-700 font-bold hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-40 disabled:hover:bg-white"
                >+</button>
              </div>
              {bouquet.inStock && maxStock <= 5 && (
                <p className="text-sm text-amber-600 font-medium mt-2">⚠️ Only {maxStock} left in stock</p>
              )}
            </div>

            {/* Delivery date */}
            <div>
              <Label className="font-semibold text-gray-800 mb-2 block">Preferred Delivery Date</Label>
              <Input type="date" min={minDate.toISOString().split('T')[0]} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="border-pink-200 focus:border-rose-400" />
            </div>

            {/* Custom message */}
            <div>
              <Label className="font-semibold text-gray-800 mb-2 block">Custom Message (Optional)</Label>
              <Textarea placeholder="Write a heartfelt message..." value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={2} className="border-pink-200 focus:border-rose-400 resize-none" />
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Button size="lg" className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white" onClick={handleAddToCart} disabled={!bouquet.inStock}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {bouquet.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleHeart} className={`border-2 transition-all ${fav ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-pink-200 hover:border-rose-400'}`}>
                <Heart className={`w-5 h-5 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </Button>
            </div>

            {/* Delivery features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Truck className="w-4 h-4 text-rose-500" />, text: 'Same-day delivery' },
                { icon: <Package className="w-4 h-4 text-purple-500" />, text: 'Real-time tracking' },
                { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Freshness guarantee' },
              ].map(item => (
                <div key={item.text} className="bg-white border border-pink-100 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <p className="text-xs text-gray-600 font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Reviews / Gallery */}
        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden mb-12">
          <div className="flex border-b border-pink-100">
            {[
              { key: 'reviews', label: `Reviews (${reviews.length})`, icon: <Star className="w-4 h-4" /> },
              { key: 'gallery', label: `Customer Photos (${galleryPhotos.length})`, icon: <Camera className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab.key ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Summary */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-6 p-5 bg-rose-50 rounded-2xl mb-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-rose-600">{avgRating.toFixed(1)}</p>
                      <StarRating value={Math.round(avgRating)} />
                      <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5,4,3,2,1].map(n => {
                        const count = reviews.filter(r => r.rating === n).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-gray-600">{n}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-4 text-gray-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews list */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map(r => (
                    <div key={r.id} className="border border-pink-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{r.customerName}</p>
                          <StarRating value={r.rating} />
                        </div>
                        <p className="text-xs text-gray-400">{r.createdAt.toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">"{r.comment}"</p>
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {r.photos.map((p, i) => <img key={i} src={p} className="w-16 h-16 rounded-xl object-cover border border-pink-100" alt="" />)}
                        </div>
                      )}
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No reviews yet. Be the first!</p>
                    </div>
                  )}
                </div>

                {/* Write a review */}
                <div className="border-t border-pink-100 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">Your Rating *</Label>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">Your Review *</Label>
                      <Textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience with this bouquet..." rows={3} className="border-pink-200 focus:border-rose-400 resize-none" />
                    </div>
                    {/* Photo attachments */}
                    <div>
                      <input ref={reviewFileRef} type="file" accept="image/*" multiple onChange={handleReviewPhotoUpload} className="hidden" />
                      <button type="button" onClick={() => reviewFileRef.current?.click()} disabled={processingPhotos} className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-60">
                        {processingPhotos ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing photos…</>
                        ) : (
                          <><ImageIcon className="w-4 h-4" /> Attach Photos (optional)</>
                        )}
                      </button>
                      {reviewPhotos.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {reviewPhotos.map((p, i) => (
                            <div key={i} className="relative">
                              <img src={p} className="w-16 h-16 rounded-xl object-cover border border-pink-200" alt="" />
                              <button type="button" onClick={() => setReviewPhotos(prev => prev.filter((_, pi) => pi !== i))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white">
                      <Send className="w-4 h-4 mr-2" /> Submit Review
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div>
                {galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryPhotos.map(p => (
                      <div key={p.id} className="rounded-2xl overflow-hidden border border-pink-100 group">
                        <img src={p.imageUrl} alt={p.caption} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-700">{p.customerName}</p>
                          {p.caption && <p className="text-xs text-gray-400 italic truncate">"{p.caption}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No customer photos yet.</p>
                    <Link to="/gallery" className="text-rose-500 hover:underline text-sm mt-2 block">Visit the Gallery to share yours!</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar bouquets */}
        {similarBouquets.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarBouquets.map(s => (
                <BouquetCard key={s.id} bouquet={s} showRecommendation recommendationText={s.reasons[0]?.message} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
