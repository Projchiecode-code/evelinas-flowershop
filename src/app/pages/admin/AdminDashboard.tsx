import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Package, Star, Banknote, Users } from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { useProducts } from '../../contexts/ProductsContext';
import { formatCurrency } from '../../utils/currency';

const PIE_COLORS = ['#f43f5e', '#a855f7', '#ec4899', '#fb7185', '#c084fc'];
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_TO_SHOW = 6;

// Cancelled orders never earn money — excluded from every revenue figure.
const revenueOf = (orders: { total: number; status?: string }[]) =>
  orders.reduce((sum, o) => sum + (o.status === 'cancelled' ? 0 : Number(o.total) || 0), 0);

const pctChange = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 'New' : '—';
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`;
};

export function AdminDashboard() {
  const { orders } = useOrders();
  const { bouquets } = useProducts();

  const totalRevenue = revenueOf(orders);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['to-pay', 'to-ship', 'to-receive'].includes(o.status)).length;

  const ratings = orders.map(o => o.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

  // KPI badges compare the last 30 days against the 30 days before that.
  const now = Date.now();
  const ordersInWindow = (fromAgoMs: number, toAgoMs: number) =>
    orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t <= now - toAgoMs && t > now - fromAgoMs;
    });

  const thisMonth = ordersInWindow(30 * DAY_MS, 0);
  const lastMonth = ordersInWindow(60 * DAY_MS, 30 * DAY_MS);
  const revenueChange = pctChange(revenueOf(thisMonth), revenueOf(lastMonth));
  const ordersChange = pctChange(thisMonth.length, lastMonth.length);
  const ratingChange = ratings.length ? `${ratings.length} rating${ratings.length === 1 ? '' : 's'}` : 'No ratings yet';

  // Real monthly revenue + order counts for the charts (last 6 months).
  const monthly = (() => {
    const data: { month: string; revenue: number; orders: number }[] = [];
    for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const monthOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      });

      data.push({
        month: start.toLocaleDateString('en-US', { month: 'short' }),
        revenue: revenueOf(monthOrders),
        orders: monthOrders.length,
      });
    }
    return data;
  })();

  const categoryData = Array.from(new Set(bouquets.map(b => b.category))).map(cat => ({
    name: cat,
    value: bouquets.filter(b => b.category === cat).length,
  }));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const STATUS_LABEL: Record<string, string> = {
    'to-pay': 'To Pay', 'to-ship': 'To Ship', 'to-receive': 'To Receive',
    'to-rate': 'To Rate', 'rated': 'Completed', 'cancelled': 'Cancelled',
  };
  const STATUS_COLOR: Record<string, string> = {
    'to-pay': 'bg-amber-100 text-amber-700', 'to-ship': 'bg-blue-100 text-blue-700',
    'to-receive': 'bg-purple-100 text-purple-700', 'to-rate': 'bg-green-100 text-green-700',
    'rated': 'bg-rose-100 text-rose-700', 'cancelled': 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en', { maximumFractionDigits: 0 })}`, icon: <Banknote className="w-5 h-5" />, color: 'from-rose-500 to-pink-500', change: revenueChange, hint: 'last 30 days vs previous 30 days' },
          { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag className="w-5 h-5" />, color: 'from-purple-500 to-violet-500', change: ordersChange, hint: 'last 30 days vs previous 30 days' },
          { label: 'Active Orders', value: pendingOrders, icon: <Package className="w-5 h-5" />, color: 'from-pink-500 to-rose-400', change: '', hint: '' },
          { label: 'Avg Rating', value: avgRating ? avgRating.toFixed(1) + '★' : 'N/A', icon: <Star className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-500', change: ratingChange, hint: 'across rated orders' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-sm`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="bg-white/20 rounded-lg p-2">{stat.icon}</div>
              {stat.change && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-right" title={stat.hint}>{stat.change}</span>}
            </div>
            <p className="text-2xl font-bold truncate">{stat.value}</p>
            <p className="text-sm text-white/80 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" /> Monthly Revenue
          </h2>
          <p className="text-xs text-gray-400 mb-4">Last {MONTHS_TO_SHOW} months · live order data · cancelled orders excluded</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`₱${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">Products by Category</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {categoryData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-1">Order Trend</h2>
        <p className="text-xs text-gray-400 mb-4">Orders placed per month · last {MONTHS_TO_SHOW} months</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="orders" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" /> Recent Orders
        </h2>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No orders yet — new orders will show up here.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rose-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Order ID</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-rose-50 hover:bg-rose-50/50 transition-colors">
                    <td className="py-3 font-mono text-xs text-gray-600">{o.id}</td>
                    <td className="py-3 text-gray-800 font-medium">{o.customerName}</td>
                    <td className="py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right font-bold text-rose-600">{formatCurrency(Number(o.total) || 0)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
