import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Star, Users, Award, Package, Calendar, ChevronDown } from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { useReviews } from '../../contexts/ReviewsContext';
import { bouquets } from '../../data/bouquets';
import { Input } from '../../components/ui/input';

const PIE_COLORS = ['#f43f5e', '#a855f7', '#ec4899', '#fb7185', '#c084fc', '#f472b6'];

type Range = 'today' | '7d' | '30d' | 'custom';

const ALL_MONTHLY = [
  { month: 'Jan', revenue: 4200, orders: 42, customers: 38 },
  { month: 'Feb', revenue: 6800, orders: 68, customers: 61 },
  { month: 'Mar', revenue: 5900, orders: 59, customers: 53 },
  { month: 'Apr', revenue: 7400, orders: 74, customers: 67 },
  { month: 'May', revenue: 9100, orders: 91, customers: 84 },
  { month: 'Jun', revenue: 8300, orders: 83, customers: 76 },
];

const ALL_WEEKLY = [
  { day: 'Mon', revenue: 1200 },
  { day: 'Tue', revenue: 980 },
  { day: 'Wed', revenue: 1450 },
  { day: 'Thu', revenue: 2100 },
  { day: 'Fri', revenue: 2800 },
  { day: 'Sat', revenue: 3200 },
  { day: 'Sun', revenue: 1900 },
];

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const RANGE_MULTIPLIERS: Record<Range, number> = { today: 0.04, '7d': 0.25, '30d': 1, custom: 1 };

export function Reports() {
  const { orders } = useOrders();
  const { getApprovedReviews } = useReviews();

  const [range, setRange] = useState<Range>('30d');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const mult = RANGE_MULTIPLIERS[range];

  const totalRevenue = (orders.reduce((s, o) => s + o.total, 0) + 41700) * mult;
  const totalOrders = Math.round((orders.length + 417) * mult);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const approvedReviews = getApprovedReviews();
  const avgRating = approvedReviews.length ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length) : 4.8;

  const chartData = useMemo(() => {
    if (range === 'today' || range === '7d') {
      return ALL_WEEKLY.map(d => ({ ...d, revenue: Math.round(d.revenue * mult) }));
    }
    return ALL_MONTHLY.map(d => ({ ...d, revenue: Math.round(d.revenue * mult), orders: Math.round(d.orders * mult), customers: Math.round(d.customers * mult) }));
  }, [range, mult]);

  const chartKey = range === 'today' || range === '7d' ? 'day' : 'month';

  const categoryData = Array.from(new Set(bouquets.map(b => b.category))).map(cat => ({
    name: cat,
    orders: Math.round((Math.floor(Math.random() * 80 + 20)) * mult),
    revenue: Math.round((Math.floor(Math.random() * 5000 + 1000)) * mult),
  }));

  const bestSellers = [...bouquets].sort((a, b) => b.popularity - a.popularity).slice(0, 5).map(b => ({
    name: b.name.length > 20 ? b.name.slice(0, 18) + '…' : b.name,
    full: b.name,
    orders: Math.round(((b.popularity / 100) * 60 + 10) * mult),
    revenue: Math.round(((b.popularity / 100) * 60 + 10) * mult * b.price),
  }));

  const pieData = categoryData.map(d => ({ name: d.name, value: d.orders }));

  const selectedLabel = RANGE_OPTIONS.find(r => r.value === range)?.label || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Business insights for Evelina's Flowershop</p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen(!rangeOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-pink-200 rounded-2xl text-sm font-semibold text-gray-700 hover:border-rose-400 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-rose-500" />
              {selectedLabel}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
            </button>
            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-lg border border-pink-100 z-20 overflow-hidden">
                  {RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setRange(opt.value); setRangeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-rose-50 ${range === opt.value ? 'text-rose-600 font-bold bg-rose-50' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Custom date range */}
          {range === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-pink-200 rounded-2xl px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="border-0 h-7 text-xs p-0 w-28 focus:ring-0" />
              <span className="text-gray-400 text-xs">→</span>
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="border-0 h-7 text-xs p-0 w-28 focus:ring-0" />
            </div>
          )}

          {/* Active range badge */}
          <div className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-xs font-semibold">
            {range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' :
              customFrom && customTo ? `${customFrom} → ${customTo}` : 'Custom range'}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: <DollarSign className="w-5 h-5" />, color: 'from-rose-500 to-pink-600', change: '+18%' },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'from-purple-500 to-violet-600', change: '+12%' },
          { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(0)}`, icon: <TrendingUp className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', change: '+5%' },
          { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) + '★' : '4.8★', icon: <Star className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', change: '+0.2' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-xl p-2">{kpi.icon}</div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-sm text-white/80 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" /> Revenue —
            <span className="text-rose-500 font-semibold text-sm">{selectedLabel}</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">Showing {chartKey === 'day' ? 'daily' : 'monthly'} breakdown</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey={chartKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">Orders by Category</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly + Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">
            {range === '7d' || range === 'today' ? 'Daily' : 'Weekly'} Revenue
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ALL_WEEKLY.map(d => ({ ...d, revenue: Math.round(d.revenue * mult) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="url(#barGrad2)" />
              <defs>
                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Customer Growth
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey={chartKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best Sellers */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Award className="w-4 h-4 text-rose-500" /> Best-Selling Bouquets
          <span className="text-xs text-gray-400 font-normal ml-1">— {selectedLabel}</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rose-50 border-b border-rose-100">
              <tr>
                <th className="text-left p-3 text-gray-600 font-semibold">Rank</th>
                <th className="text-left p-3 text-gray-600 font-semibold">Bouquet</th>
                <th className="text-right p-3 text-gray-600 font-semibold">Orders</th>
                <th className="text-right p-3 text-gray-600 font-semibold">Revenue</th>
                <th className="text-left p-3 text-gray-600 font-semibold hidden sm:table-cell">Performance</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((b, i) => (
                <tr key={b.name} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                  <td className="p-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-rose-100 text-rose-600'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{b.name}</td>
                  <td className="p-3 text-right text-gray-700">{b.orders}</td>
                  <td className="p-3 text-right font-bold text-rose-600">${b.revenue.toFixed(0)}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-rose-500 to-purple-500 h-2 rounded-full" style={{ width: `${bestSellers[0].orders > 0 ? (b.orders / bestSellers[0].orders) * 100 : 0}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: Math.round(284 * mult).toString(), icon: <Users className="w-5 h-5 text-purple-500" />, sub: '+23 this period' },
          { label: 'Repeat Customers', value: '67%', icon: <Star className="w-5 h-5 text-yellow-500" />, sub: '191 returning' },
          { label: 'Most Ordered', value: 'Roses', icon: <Package className="w-5 h-5 text-rose-500" />, sub: `${Math.round(142 * mult)} orders` },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
