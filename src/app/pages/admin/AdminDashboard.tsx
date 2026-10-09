import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Package, Star, DollarSign, Users } from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { bouquets } from '../../data/bouquets';

const MONTHLY = [
  { month: 'Jan', revenue: 4200, orders: 42 },
  { month: 'Feb', revenue: 6800, orders: 68 },
  { month: 'Mar', revenue: 5900, orders: 59 },
  { month: 'Apr', revenue: 7400, orders: 74 },
  { month: 'May', revenue: 9100, orders: 91 },
  { month: 'Jun', revenue: 8300, orders: 83 },
];

const PIE_COLORS = ['#f43f5e', '#a855f7', '#ec4899', '#fb7185', '#c084fc'];

export function AdminDashboard() {
  const { orders } = useOrders();

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => ['to-pay', 'to-ship', 'to-receive'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => ['to-rate', 'rated'].includes(o.status)).length;
  const avgRating = orders.filter(o => o.rating).reduce((s, o, _, arr) => s + (o.rating || 0) / arr.length, 0);

  const categoryData = Array.from(new Set(bouquets.map(b => b.category))).map(cat => ({
    name: cat,
    value: bouquets.filter(b => b.category === cat).length,
  }));

  const recentOrders = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

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
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: <DollarSign className="w-5 h-5" />, color: 'from-rose-500 to-pink-500', change: '+12%' },
          { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'from-purple-500 to-violet-500', change: '+8%' },
          { label: 'Active Orders', value: pendingOrders, icon: <Package className="w-5 h-5" />, color: 'from-pink-500 to-rose-400', change: '' },
          { label: 'Avg Rating', value: avgRating ? avgRating.toFixed(1) + '★' : 'N/A', icon: <Star className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-500', change: '+0.2' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-lg p-2">{stat.icon}</div>
              {stat.change && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{stat.change}</span>}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-white/80 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" /> Monthly Revenue
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'Revenue']} />
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
        <h2 className="font-bold text-gray-800 mb-5">Order Trend</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="orders" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5">Recent Orders</h2>
        <div className="overflow-x-auto">
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
                  <td className="py-3 text-gray-500">{o.createdAt.toLocaleDateString()}</td>
                  <td className="py-3 text-right font-bold text-rose-600">${o.total.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
