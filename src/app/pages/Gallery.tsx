import { useState, useRef } from 'react';
import { Heart, Upload, Camera, Star, X, ShoppingCart, MessageCircle, Send, ChevronDown, ChevronUp, MoreHorizontal, Share2, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useGallery } from '../contexts/GalleryContext';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../contexts/ProductsContext';
import { GalleryPhoto } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/currency';
import { compressImage } from '../utils/imageCompress';

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ photo }: { photo: GalleryPhoto }) {
  const { bouquets } = useProducts();
  const { likePhoto, addComment, getCommentsForPhoto } = useGallery();
  const { addToCart } = useCart();

  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [lightbox, setLightbox] = useState(false);

  const comments = getCommentsForPhoto(photo.id);
  const linkedBouquet = bouquets.find(b => b.id === photo.bouquetId);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    likePhoto(photo.id);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(photo.id, commentName || 'Anonymous', commentText);
    setCommentText('');
    toast.success('Comment posted!');
  };

  const handleAddToCart = () => {
    if (!linkedBouquet) return;
    addToCart(linkedBouquet, 1);
    toast.success(`${linkedBouquet.name} added to cart! 🌸`);
  };

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={photo.imageUrl} alt="" className="max-w-3xl w-full max-h-[90vh] object-contain rounded-2xl" />
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center">✕</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Post Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {photo.customerName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-tight">{photo.customerName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{timeAgo(photo.createdAt)}</span>
              {photo.bouquetName && (
                <>
                  <span>•</span>
                  <span className="text-rose-500">🌸 {photo.bouquetName}</span>
                </>
              )}
              {photo.featured && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs py-0">⭐ Featured</Badge>}
            </div>
          </div>
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
        </div>

        {/* Caption */}
        {photo.caption && (
          <p className="px-5 pb-3 text-sm text-gray-700 leading-relaxed">"{photo.caption}"</p>
        )}

        {/* Photo — clickable */}
        <div className="cursor-pointer" onClick={() => setLightbox(true)}>
          <img src={photo.imageUrl} alt={photo.caption} className="w-full object-cover max-h-[480px] hover:brightness-95 transition-all" />
        </div>

        {/* Like / Comment counts */}
        <div className="flex items-center justify-between px-5 py-2 text-xs text-gray-400 border-b border-rose-50">
          <span>{photo.likes + (liked ? 1 : 0)} likes</span>
          <button onClick={() => setShowComments(!showComments)} className="hover:text-rose-600 transition-colors">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center px-3 py-1 border-b border-rose-50">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${liked ? 'text-rose-600' : 'text-gray-500 hover:bg-rose-50 hover:text-rose-500'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            Like
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-blue-50 hover:text-blue-500 transition-all">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Linked Bouquet Product Card */}
        {linkedBouquet && (
          <div className="mx-4 my-3 bg-gradient-to-r from-rose-50 to-purple-50 border border-pink-200 rounded-2xl p-4 flex items-center gap-4">
            <img src={linkedBouquet.image} alt={linkedBouquet.name} className="w-16 h-16 rounded-xl object-cover border border-pink-100" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{linkedBouquet.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{linkedBouquet.category}</p>
              <p className="font-bold text-rose-600 text-sm mt-0.5">{formatCurrency(linkedBouquet.price)}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button size="sm" onClick={handleAddToCart} className="bg-rose-500 hover:bg-rose-600 text-white text-xs whitespace-nowrap">
                <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
              </Button>
              <Link to={`/bouquet/${linkedBouquet.id}`}>
                <Button size="sm" variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 text-xs">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="px-5 pb-4 space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.authorName.charAt(0)}
                </div>
                <div className="flex-1 bg-rose-50 rounded-2xl rounded-tl-none px-3 py-2">
                  <p className="text-xs font-bold text-gray-800">{c.authorName}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
                  <p className="text-xs text-gray-300 mt-1">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex items-start gap-2 pt-1">
              <div className="w-7 h-7 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                You
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="border-pink-200 h-7 text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="border-pink-200 text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Gallery Page ────────────────────────────────────────────────────────
export function Gallery() {
  const { bouquets } = useProducts();
  const { getApprovedPhotos, getFeaturedPhotos, submitPhoto, hasMore, isLoadingMore, loadMore } = useGallery();
  const [filter, setFilter] = useState<'all' | 'featured'>('all');
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ customerName: '', caption: '', bouquetId: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = getApprovedPhotos();
  const featured = getFeaturedPhotos();
  const displayed = filter === 'featured' ? featured : photos;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    // Sanity cap before the (lossy) downscale — real phone photos sit far below.
    if (file.size > 15 * 1024 * 1024) { toast.error('Photo must be under 15 MB'); return; }
    setProcessingPhoto(true);
    try {
      // Downscale + re-encode in the browser (~1600 px, ≤1.4M chars) so the
      // submission stays tiny in the database.
      const processed = await compressImage(file);
      setImagePreview(processed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process that photo');
    } finally {
      setProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || !form.customerName) { toast.error('Please add a photo and your name'); return; }
    const linked = bouquets.find(b => b.id === form.bouquetId);
    submitPhoto({
      customerName: form.customerName,
      caption: form.caption,
      bouquetName: linked?.name || '',
      bouquetId: form.bouquetId || undefined,
      imageUrl: imagePreview,
    });
    toast.success('Post submitted! It will appear after review. 🌸');
    setShowSubmit(false);
    setForm({ customerName: '', caption: '', bouquetId: '' });
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-14 text-center">
        <Camera className="w-12 h-12 mx-auto mb-4 text-rose-200" />
        <h1 className="text-4xl font-bold mb-2">Bouquet Community</h1>
        <p className="text-rose-100 mb-6 max-w-lg mx-auto">
          Share your flowers, discover beautiful bouquets, and connect with fellow flower lovers.
        </p>
        <Button onClick={() => setShowSubmit(true)} className="bg-white text-rose-600 hover:bg-rose-50 font-semibold">
          <Upload className="w-4 h-4 mr-2" /> Share Your Bouquet
        </Button>
      </div>

      {/* Submit Post Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden my-4">
            <div className="bg-gradient-to-r from-rose-500 to-purple-500 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white">Create a Post</h3>
              <button onClick={() => setShowSubmit(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Your Name *</label>
                <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Jane D." className="border-pink-200" required />
              </div>

              {/* Bouquet link */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Tag a Bouquet (optional)</label>
                <select value={form.bouquetId} onChange={e => setForm(f => ({ ...f, bouquetId: e.target.value }))} className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
                  <option value="">— Select bouquet —</option>
                  {bouquets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Caption</label>
                <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="What's the story behind this bouquet?" rows={2} className="w-full border border-pink-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-rose-400" />
              </div>

              {/* Photo */}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {!imagePreview ? (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={processingPhoto} className="w-full border-2 border-dashed border-pink-300 rounded-2xl p-8 text-center hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-60">
                  {processingPhoto ? (
                    <>
                      <Loader2 className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-500 text-sm font-medium">Optimizing photo…</p>
                      <p className="text-xs text-gray-400 mt-0.5">Shrinking it for faster sharing</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-pink-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm font-medium">Add Photo *</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG accepted</p>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={imagePreview} className="w-full h-48 object-cover" alt="Preview" />
                  <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"><X className="w-4 h-4 text-gray-600" /></button>
                </div>
              )}
              <Button type="submit" disabled={processingPhoto} className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white font-semibold">Post to Community</Button>
            </form>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          {(['all', 'featured'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${filter === f ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-pink-200 text-gray-600 hover:border-rose-300'}`}>
              {f === 'all' ? `All Posts (${photos.length})` : `⭐ Featured (${featured.length})`}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {displayed.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-12 h-12 text-pink-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No posts yet.</p>
              <p className="text-sm text-gray-300">Be the first to share your bouquet!</p>
            </div>
          ) : (
            displayed.map(photo => <PostCard key={photo.id} photo={photo} />)
          )}
        </div>

        {/* Older posts load on demand — the feed ships one page at a time. */}
        {filter === 'all' && hasMore && (
          <div className="text-center pt-6">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="border-pink-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
            >
              {isLoadingMore ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</>
              ) : (
                'Load more posts'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
