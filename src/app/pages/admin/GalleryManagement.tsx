import { useState } from 'react';
import { Heart, Check, Trash2, Star, Search, Camera, MessageCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useGallery } from '../../contexts/GalleryContext';

export function GalleryManagement() {
  const { photos, comments, approvePhoto, deletePhoto, featurePhoto, approveComment, deleteComment } = useGallery();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const filtered = photos.filter(p => {
    const matchSearch = p.customerName.toLowerCase().includes(search.toLowerCase()) || p.caption.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'approved' ? p.approved && !p.featured : filter === 'pending' ? !p.approved : p.featured);
    return matchSearch && matchFilter;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const pendingCount = photos.filter(p => !p.approved).length;
  const featuredCount = photos.filter(p => p.featured).length;
  const pendingComments = comments.filter(c => !c.approved).length;

  const toggleComments = (photoId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(photoId) ? next.delete(photoId) : next.add(photoId);
      return next;
    });
  };

  const getPhotoComments = (photoId: string) => comments.filter(c => c.photoId === photoId);

  return (
    <div className="space-y-6">
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-2xl w-full max-h-screen object-contain rounded-2xl" alt="" />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gallery Management</h1>
          <p className="text-gray-500 text-sm">{photos.length} total photos</p>
        </div>
        {pendingComments > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            {pendingComments} comment{pendingComments > 1 ? 's' : ''} need review
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: pendingCount, color: 'from-amber-500 to-orange-500' },
          { label: 'Approved', value: photos.filter(p => p.approved).length, color: 'from-green-500 to-emerald-500' },
          { label: 'Featured', value: featuredCount, color: 'from-purple-500 to-violet-500' },
          { label: 'Comments', value: comments.length, color: 'from-rose-500 to-pink-500' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white text-center shadow-sm`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or caption..." className="pl-10 border-pink-200" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'featured'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${filter === f ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-pink-200 text-gray-600 hover:border-rose-300'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="space-y-4">
        {filtered.map(photo => {
          const photoComments = getPhotoComments(photo.id);
          const pendingPhotoComments = photoComments.filter(c => !c.approved).length;
          const showingComments = expandedComments.has(photo.id);

          return (
            <div key={photo.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${photo.approved ? 'border-pink-100' : 'border-amber-200'}`}>
              {/* Post header */}
              <div className="flex items-center gap-4 p-4">
                <div className="relative cursor-pointer" onClick={() => setLightbox(photo.imageUrl)}>
                  <img src={photo.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-pink-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-800">{photo.customerName}</p>
                    {photo.featured && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">⭐ Featured</Badge>}
                    {!photo.approved && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>}
                  </div>
                  {photo.bouquetName && <p className="text-xs text-rose-600 font-medium">{photo.bouquetName}</p>}
                  {photo.caption && <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">"{photo.caption}"</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{photo.createdAt.toLocaleDateString()}</span>
                    <span>❤️ {photo.likes}</span>
                    <span>💬 {photoComments.length} comment{photoComments.length !== 1 ? 's' : ''}</span>
                    {pendingPhotoComments > 0 && (
                      <span className="text-amber-600 font-semibold">⚠️ {pendingPhotoComments} pending</span>
                    )}
                  </div>
                </div>
                {/* Photo actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => approvePhoto(photo.id)} title={photo.approved ? 'Unapprove' : 'Approve'} className={`p-2 rounded-xl text-xs font-semibold transition-all border ${photo.approved ? 'bg-green-50 text-green-600 border-green-200 hover:bg-gray-50 hover:text-gray-400 hover:border-gray-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => featurePhoto(photo.id, !photo.featured)} title={photo.featured ? 'Unfeature' : 'Feature'} className={`p-2 rounded-xl transition-all border ${photo.featured ? 'bg-yellow-50 text-yellow-500 border-yellow-200' : 'bg-white text-gray-300 border-gray-200 hover:bg-yellow-50 hover:text-yellow-500 hover:border-yellow-200'}`}>
                    <Star className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleComments(photo.id)} className={`p-2 rounded-xl transition-all border ${showingComments ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-purple-50 hover:text-purple-500'}`}>
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  {deleteId === photo.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { deletePhoto(photo.id); setDeleteId(null); }} className="px-2 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold">Delete</button>
                      <button onClick={() => setDeleteId(null)} className="px-2 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-xs">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(photo.id)} className="p-2 rounded-xl text-gray-300 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment moderation — expanded inline */}
              {showingComments && (
                <div className="border-t border-rose-50 bg-rose-50/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-500" />
                      Comments ({photoComments.length})
                      {pendingPhotoComments > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{pendingPhotoComments} pending</Badge>
                      )}
                    </p>
                  </div>

                  {photoComments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-3">No comments on this post yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {photoComments.map(comment => (
                        <div key={comment.id} className={`flex items-start gap-3 bg-white rounded-xl p-3 border ${comment.approved ? 'border-green-100' : 'border-amber-200 bg-amber-50/50'}`}>
                          <div className="w-7 h-7 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {comment.authorName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-bold text-gray-800">{comment.authorName}</p>
                              {comment.approved
                                ? <Badge className="bg-green-100 text-green-700 text-xs border-green-200">Approved</Badge>
                                : <Badge className="bg-amber-100 text-amber-700 text-xs border-amber-200">Pending</Badge>}
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{comment.createdAt.toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => approveComment(comment.id)} title={comment.approved ? 'Unapprove' : 'Approve'} className={`p-1.5 rounded-lg transition-colors ${comment.approved ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500'}`}>
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteComment(comment.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No photos found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
