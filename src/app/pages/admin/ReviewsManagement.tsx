import { useState } from 'react';
import { Star, Check, Trash2, Search, Filter, MessageSquare } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useReviews } from '../../contexts/ReviewsContext';
import { useProducts } from '../../contexts/ProductsContext';

function Stars({ n }: { n: number }) {
  return <span className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}</span>;
}

export function ReviewsManagement() {
  const { reviews, approveReview, deleteReview, featureReview } = useReviews();
  const { bouquets } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = reviews.filter(r => {
    const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'approved' ? r.approved : !r.approved);
    return matchSearch && matchFilter;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const pendingCount = reviews.filter(r => !r.approved).length;
  const approvedCount = reviews.filter(r => r.approved).length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reviews Management</h1>
        <p className="text-gray-500 text-sm">{reviews.length} total reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pendingCount, color: 'from-amber-500 to-orange-500' },
          { label: 'Approved', value: approvedCount, color: 'from-green-500 to-emerald-500' },
          { label: 'Avg Rating', value: avgRating + '★', color: 'from-rose-500 to-pink-500' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white text-center shadow-sm`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-10 border-pink-200" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === f ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-pink-200 text-gray-600 hover:border-rose-300'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rose-50 border-b border-rose-100">
              <tr>
                <th className="text-left p-4 text-gray-600 font-semibold">Reviewer</th>
                <th className="text-left p-4 text-gray-600 font-semibold hidden sm:table-cell">Bouquet</th>
                <th className="text-left p-4 text-gray-600 font-semibold">Rating</th>
                <th className="text-left p-4 text-gray-600 font-semibold hidden md:table-cell">Comment</th>
                <th className="text-center p-4 text-gray-600 font-semibold">Status</th>
                <th className="text-right p-4 text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(review => {
                const bouquet = bouquets.find(b => b.id === review.bouquetId);
                return (
                  <tr key={review.id} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{review.customerName}</p>
                      <p className="text-xs text-gray-400">{review.createdAt.toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-700 max-w-28 truncate">{bouquet?.name || 'Unknown'}</p>
                    </td>
                    <td className="p-4"><Stars n={review.rating} /></td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">"{review.comment}"</p>
                    </td>
                    <td className="p-4 text-center">
                      {review.approved
                        ? <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
                        : <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => approveReview(review.id)} title={review.approved ? 'Unapprove' : 'Approve'} className={`p-1.5 rounded-lg transition-colors ${review.approved ? 'text-green-500 hover:bg-gray-50 hover:text-gray-400' : 'text-gray-300 hover:bg-green-50 hover:text-green-600'}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => featureReview(review.id, !review.featured)} title={review.featured ? 'Unfeature' : 'Feature'} className={`p-1.5 rounded-lg transition-colors ${review.featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}>
                          <Star className="w-4 h-4" />
                        </button>
                        {deleteId === review.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => { deleteReview(review.id); setDeleteId(null); }} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Del</button>
                            <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(review.id)} className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No reviews found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
