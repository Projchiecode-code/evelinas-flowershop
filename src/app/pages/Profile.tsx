import { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Heart, ShoppingBag, Star, Edit2, Check } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useOrders } from '../contexts/OrderContext';
import { useReviews } from '../contexts/ReviewsContext';

export function Profile() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { orders } = useOrders();
  const { reviews } = useReviews();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', address: '' });

  const myReviews = reviews.filter(r => r.customerEmail === user?.email);
  const completedOrders = orders.filter(o => o.status === 'rated' || o.status === 'to-rate').length;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <Link to="/login"><Button className="bg-rose-500 text-white">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
            {user.name.charAt(0)}
          </div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-rose-100">{user.email}</p>
          {user.role === 'admin' && <Badge className="mt-2 bg-yellow-400 text-yellow-900">👑 Admin</Badge>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'from-rose-500 to-pink-500' },
              { label: 'Completed', value: completedOrders, icon: <Check className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
              { label: 'Favorites', value: favorites.length, icon: <Heart className="w-5 h-5" />, color: 'from-purple-500 to-violet-500' },
              { label: 'Reviews', value: myReviews.length, icon: <Star className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-sm text-center`}>
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2">{s.icon}</div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-white/80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Profile Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><User className="w-4 h-4 text-rose-500" /> Personal Information</h2>
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="border-rose-200 text-rose-600">
                {editing ? <><Check className="w-3.5 h-3.5 mr-1" /> Save</> : <><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</>}
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { icon: <User className="w-4 h-4" />, label: 'Full Name', key: 'name', value: form.name },
                { icon: <Mail className="w-4 h-4" />, label: 'Email', key: 'email', value: form.email },
                { icon: <Phone className="w-4 h-4" />, label: 'Phone', key: 'phone', value: form.phone },
                { icon: <MapPin className="w-4 h-4" />, label: 'Default Address', key: 'address', value: form.address },
              ].map(field => (
                <div key={field.key} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 shrink-0 mt-0.5">{field.icon}</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{field.label}</p>
                    {editing ? (
                      <Input value={field.value} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="border-pink-200 h-8 text-sm" placeholder={`Enter ${field.label.toLowerCase()}`} />
                    ) : (
                      <p className="text-sm font-medium text-gray-800">{field.value || <span className="text-gray-300 italic">Not set</span>}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            {[
              { to: '/order-history', icon: <ShoppingBag className="w-5 h-5 text-rose-500" />, label: 'My Orders', desc: `${orders.length} total orders` },
              { to: '/favorites', icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'My Favorites', desc: `${favorites.length} saved bouquets` },
              { to: '/track', icon: <MapPin className="w-5 h-5 text-purple-500" />, label: 'Track Order', desc: 'Check delivery status' },
              { to: '/catalog', icon: <Camera className="w-5 h-5 text-emerald-500" />, label: 'Browse Catalog', desc: 'Find your next bouquet' },
            ].map(link => (
              <Link key={link.to} to={link.to}>
                <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 flex items-center gap-4 hover:border-rose-200 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">{link.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-rose-600 transition-colors">{link.label}</p>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Total Spent */}
          <div className="lg:col-span-3 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">Total Spent at Evelina's Flowershop</p>
              <p className="text-4xl font-bold mt-1">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-6xl opacity-20">🌸</div>
          </div>
        </div>
      </div>
    </div>
  );
}
