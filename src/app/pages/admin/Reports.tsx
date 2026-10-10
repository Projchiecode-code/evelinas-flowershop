import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Banknote, ShoppingBag, Star, Users, Award, Package, Calendar, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { useOrders } from '../../contexts/OrderContext';
import { useReviews } from '../../contexts/ReviewsContext';
import { useProducts } from '../../contexts/ProductsContext';
import { Order } from '../../types';
import { Input } from '../../components/ui/input';
import { classifyStock, LOW_STOCK_THRESHOLD } from '../../utils/inventory';

const PIE_COLORS = ['#f43f5e', '#a855f7', '#ec4899', '#fb7185', '#c084fc', '#f472b6'];
const DAY_MS = 24 * 60 * 60 * 1000;

type Range = 'today' | '7d' | '30d' | 'custom';

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function Reports() {
  const { orders } = useOrders();
  const { getApprovedReviews } = useReviews();

  const [range, setRange] = useState<Range>('30d');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // ── Reporting window ────────────────────────────────────────────────
  const { start: periodStart, end: periodEnd } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * DAY_MS);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * DAY_MS);
        break;
      case 'custom':
        if (customFrom) {
          start = new Date(customFrom);
          start.setHours(0, 0, 0, 0);
          if (customTo) {
            end = new Date(customTo);
            end.setHours(23, 59, 59, 999);
          }
        } else {
          start = new Date(now.getTime() - 30 * DAY_MS);
        }
        break;
      default:
        start = new Date(now.getTime() - 30 * DAY_MS);
    }

    return { start, end };
  }, [range, customFrom, customTo]);

  // The window directly before the selected one — used for the % change badges.
  const { start: prevStart, end: prevEnd } = useMemo(() => {
    const length = Math.max(periodEnd.getTime() - periodStart.getTime(), 60 * 1000);
    return {
      start: new Date(periodStart.getTime() - length),
      end: new Date(periodStart.getTime() - 1),
    };
  }, [periodStart, periodEnd]);

  const inWindow = (order: Order, start: Date, end: Date) => {
    const t = new Date(order.createdAt).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const filteredOrders = useMemo(
    () => orders.filter(o => inWindow(o, periodStart, periodEnd)),
    [orders, periodStart, periodEnd]
  );
  const previousOrders = useMemo(
    () => orders.filter(o => inWindow(o, prevStart, prevEnd)),
    [orders, prevStart, prevEnd]
  );

  // Cancelled orders never earn money — they are excluded from every revenue figure.
  const billable = (list: Order[]) => list.filter(o => o.status !== 'cancelled');
  const revenueOf = (list: Order[]) => list.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const periodOrders = billable(filteredOrders);
  const prevPeriodOrders = billable(previousOrders);

  // ── Real metrics from real orders ───────────────────────────────────
  const totalRevenue = revenueOf(periodOrders);
  const prevRevenue = revenueOf(prevPeriodOrders);
  const totalOrders = filteredOrders.length;
  const prevTotalOrders = previousOrders.length;
  const avgOrderValue = periodOrders.length ? totalRevenue / periodOrders.length : 0;
  const prevAvgOrderValue = prevPeriodOrders.length ? prevRevenue / prevPeriodOrders.length : 0;

  const approvedReviews = getApprovedReviews();
  const avgRating = approvedReviews.length
    ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length
    : 0;

  const pctChange = (current: number, previous: number) => {
    if (!previous) return current > 0 ? 'New' : '—';
    const delta = ((current - previous) / previous) * 100;
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`;
  };

  // Charts always cover their own trailing window (last 7 days / last 6 months)
  // from real orders, so months outside the selected KPI range don't read as zero.
  const revenueEligible = useMemo(() => billable(orders), [orders]);

  // Daily revenue data for the last 7 days
  const dailyRevenueData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = revenueEligible.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const dayRevenue = dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }
    return data;
  }, [revenueEligible]);

  // Generate monthly revenue data for the last 6 months
  const monthlyRevenueData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      const monthOrders = revenueEligible.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const monthRevenue = monthOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const monthCustomers = new Set(
        monthOrders.map(o => (o.email || o.customerName || 'guest').toLowerCase())
      ).size;

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        date: date.toISOString().split('T')[0],
        revenue: monthRevenue,
        orders: monthOrders.length,
        customers: monthCustomers,
      });
    }
    return data;
  }, [revenueEligible]);

  // Category data from actual orders
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { orders: number; revenue: number }>();
    
    periodOrders.forEach(order => {
      order.items?.forEach(item => {
        const bouquet = item.bouquet;
        if (bouquet && bouquet.category) {
          const existing = categoryMap.get(bouquet.category) || { orders: 0, revenue: 0 };
          existing.orders += item.quantity || 1;
          existing.revenue += (item.price || bouquet.price || 0) * (item.quantity || 1);
          categoryMap.set(bouquet.category, existing);
        }
      });
    });
    
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      orders: data.orders,
      revenue: data.revenue,
    }));
  }, [periodOrders]);

  // Best sellers from actual order data
  const bestSellers = useMemo(() => {
    const bouquetMap = new Map<string, { name: string; orders: number; revenue: number; price: number }>();
    
    periodOrders.forEach(order => {
      order.items?.forEach(item => {
        const bouquet = item.bouquet;
        if (bouquet) {
          const existing = bouquetMap.get(bouquet.id) || { 
            name: bouquet.name, 
            orders: 0, 
            revenue: 0, 
            price: bouquet.price || 0 
          };
          existing.orders += item.quantity || 1;
          existing.revenue += (item.price || bouquet.price || 0) * (item.quantity || 1);
          bouquetMap.set(bouquet.id, existing);
        }
      });
    });
    
    return Array.from(bouquetMap.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map((b, i) => ({
        ...b,
        name: b.name.length > 20 ? b.name.slice(0, 18) + '…' : b.name,
        rank: i + 1,
      }));
  }, [periodOrders]);

  const pieData = categoryData.map(d => ({ name: d.name, value: d.orders }));

  // Customer stats for the selected window — derived from real orders only
  const customerStats = useMemo(() => {
    const byCustomer = new Map<string, number>();
    filteredOrders.forEach(o => {
      const key = (o.email || o.customerName || 'guest').trim().toLowerCase();
      byCustomer.set(key, (byCustomer.get(key) || 0) + 1);
    });

    const total = byCustomer.size;
    const repeat = Array.from(byCustomer.values()).filter(n => n > 1).length;
    const topCategory = [...categoryData].sort((a, b) => b.orders - a.orders)[0];

    return {
      total,
      firstTime: total - repeat,
      repeat,
      repeatPct: total ? Math.round((repeat / total) * 100) : 0,
      topCategory: topCategory?.name || '—',
      topCategoryUnits: topCategory?.orders || 0,
    };
  }, [filteredOrders, categoryData]);

  // Which granularity the revenue chart is showing
  const chartKey = range === 'today' || range === '7d' ? 'day' : 'month';
  const chartWindowLabel = chartKey === 'day' ? 'Last 7 days' : 'Last 6 months';
  const chartSource = chartKey === 'day' ? dailyRevenueData : monthlyRevenueData;

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
          { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: <Banknote className="w-5 h-5" />, color: 'from-rose-500 to-pink-600', change: pctChange(totalRevenue, prevRevenue), hint: `vs ${selectedLabel.toLowerCase()} prior period` },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'from-purple-500 to-violet-600', change: pctChange(totalOrders, prevTotalOrders), hint: `vs ${selectedLabel.toLowerCase()} prior period` },
          { label: 'Avg Order Value', value: `₱${avgOrderValue.toFixed(0)}`, icon: <TrendingUp className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', change: pctChange(avgOrderValue, prevAvgOrderValue), hint: `vs ${selectedLabel.toLowerCase()} prior period` },
          { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) + '★' : 'No ratings yet', icon: <Star className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', change: `${approvedReviews.length} review${approvedReviews.length === 1 ? '' : 's'}`, hint: 'across all approved reviews' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white shadow-sm`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="bg-white/20 rounded-xl p-2">{kpi.icon}</div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-right" title={kpi.hint}>{kpi.change}</span>
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
            <span className="text-rose-500 font-semibold text-sm">{chartWindowLabel}</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {chartKey === 'day' ? 'Daily' : 'Monthly'} breakdown from live orders · cancelled orders excluded
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartSource}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey={chartKey === 'day' ? 'day' : 'month'} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">Orders by Category</h2>
          {pieData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 text-center px-2">
              No orders in this period yet
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Weekly + Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1">Daily Revenue</h2>
          <p className="text-xs text-gray-400 mb-4">Last 7 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
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
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Customer Growth
          </h2>
          <p className="text-xs text-gray-400 mb-4">Unique customers per month · last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v}`, 'Customers']} />
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
              {bestSellers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400 text-sm">
                    No sales yet in this period — best sellers appear once orders come in.
                  </td>
                </tr>
              )}
              {bestSellers.map((b, i) => (
                <tr key={b.name} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                  <td className="p-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-rose-100 text-rose-600'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{b.name}</td>
                  <td className="p-3 text-right text-gray-700">{b.orders}</td>
                  <td className="p-3 text-right font-bold text-rose-600">₱{b.revenue.toFixed(0)}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-rose-500 to-purple-500 h-2 rounded-full" style={{ width: `${bestSellers[0] && bestSellers[0].orders > 0 ? (b.orders / bestSellers[0].orders) * 100 : 0}%` }} />
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
          { label: 'Total Customers', value: customerStats.total.toLocaleString(), icon: <Users className="w-5 h-5 text-purple-500" />, sub: customerStats.firstTime > 0 ? `${customerStats.firstTime} first-time this period` : 'No first-time buyers in this period' },
          { label: 'Repeat Customers', value: `${customerStats.repeatPct}%`, icon: <Star className="w-5 h-5 text-yellow-500" />, sub: customerStats.total > 0 ? `${customerStats.repeat} of ${customerStats.total} bought more than once` : 'No customers in this period' },
          { label: 'Most Ordered', value: customerStats.topCategory, icon: <Package className="w-5 h-5 text-rose-500" />, sub: customerStats.topCategoryUnits > 0 ? `${customerStats.topCategoryUnits} units sold this period` : 'No items sold yet' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">{stat.icon}</div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-800 truncate">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 5 — inventory monitoring */}
      <InventoryReport />
    </div>
  );
}

/**
 * Phase 5 — Inventory report.
 * Current stock across the whole catalog, worst first — deliberately not
 * filtered by the date range above (stock is point-in-time, not windowed).
 * Product names deep-link to the edit form (?edit=).
 */
function InventoryReport() {
  const { bouquets } = useProducts();
  if (bouquets.length === 0) return null;
  const rows = [...bouquets].sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
  const outCount = rows.filter(b => classifyStock(b) === 'out').length;
  const lowCount = rows.filter(b => classifyStock(b) === 'low').length;

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-rose-500" /> Inventory Status
        </h2>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{rows.length} products</span>
          <span className={`px-2 py-0.5 rounded-full ${lowCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{lowCount} low stock</span>
          <span className={`px-2 py-0.5 rounded-full ${outCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{outCount} out of stock</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Current stock levels — not affected by the date range above. Threshold: at or below {LOW_STOCK_THRESHOLD} units is low. Sorted lowest first.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100">
              <th className="text-left py-2 text-gray-500 font-medium">Product</th>
              <th className="text-left py-2 text-gray-500 font-medium hidden sm:table-cell">Category</th>
              <th className="text-right py-2 text-gray-500 font-medium">Units</th>
              <th className="text-right py-2 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => {
              const status = classifyStock(b);
              return (
                <tr key={b.id} className="border-b border-rose-50 hover:bg-rose-50/50 transition-colors">
                  <td className="py-2.5 pr-3">
                    <Link to={`/admin/products?edit=${b.id}`} className="font-medium text-gray-800 hover:text-rose-600 hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell text-gray-500">{b.category}</td>
                  <td className={`py-2.5 text-right font-bold ${status === 'out' ? 'text-red-500' : status === 'low' ? 'text-amber-600' : 'text-gray-700'}`}>
                    {b.stock}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status === 'out' ? 'bg-red-50 text-red-600' : status === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                      {status === 'out' ? 'Out of stock' : status === 'low' ? 'Low stock' : 'In stock'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
