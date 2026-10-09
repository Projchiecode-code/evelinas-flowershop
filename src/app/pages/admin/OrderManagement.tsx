import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Package, CreditCard, Truck, Star, CheckCircle, XCircle, ImageIcon, Eye, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useOrders } from '../../contexts/OrderContext';
import { Order, OrderStatus } from '../../types';

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'to-pay', label: 'To Pay' },
  { value: 'to-ship', label: 'To Ship' },
  { value: 'to-receive', label: 'To Receive' },
  { value: 'to-rate', label: 'To Rate' },
  { value: 'rated', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'to-pay':     { label: 'To Pay',     color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: <CreditCard className="w-3 h-3" /> },
  'to-ship':    { label: 'To Ship',    color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <Package className="w-3 h-3" /> },
  'to-receive': { label: 'To Receive', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck className="w-3 h-3" /> },
  'to-rate':    { label: 'To Rate',    color: 'bg-green-100 text-green-700 border-green-200',    icon: <Star className="w-3 h-3" /> },
  'rated':      { label: 'Completed',  color: 'bg-rose-100 text-rose-700 border-rose-200',       icon: <CheckCircle className="w-3 h-3" /> },
  'cancelled':  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-600 border-gray-200',       icon: <XCircle className="w-3 h-3" /> },
};

const PAYMENT_LABEL: Record<string, string> = {
  'cod': 'Cash on Delivery', 'e-wallet': 'E-Wallet', 'bank-transfer': 'Bank Transfer',
};

function ProofModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100">
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-rose-500" /> Payment Proof Screenshot
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="p-4 bg-gray-50">
          <img src={src} alt="Payment proof" className="w-full rounded-xl object-contain max-h-96" />
        </div>
        <div className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
          Review the payment proof and advance the order to "To Ship" if payment is verified.
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState<OrderStatus | null>(null);
  const { updateOrderStatus } = useOrders();
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['cancelled'];

  const handleAdvance = (status: OrderStatus) => {
    updateOrderStatus(order.id, status);
    setConfirmAdvance(null);
  };

  return (
    <>
      {showProof && order.paymentProof && (
        <ProofModal src={order.paymentProof} onClose={() => setShowProof(false)} />
      )}

      {confirmAdvance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-2">Confirm Status Change</h3>
            <p className="text-gray-600 text-sm mb-5">
              Move order <span className="font-mono font-bold">{order.id}</span> to{' '}
              <strong className="text-rose-600">{STATUS_CONFIG[confirmAdvance]?.label}</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmAdvance(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => handleAdvance(confirmAdvance)} className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      <tr className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
        <td className="p-4">
          <p className="font-semibold text-gray-800">{order.customerName}</p>
          <p className="text-xs text-gray-400">{order.email}</p>
        </td>
        <td className="p-4 hidden md:table-cell text-gray-600 text-sm">
          <div>{order.createdAt.toLocaleDateString()}</div>
          {order.paymentMethod && (
            <div className="text-xs text-purple-600">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</div>
          )}
        </td>
        <td className="p-4 text-right font-bold text-rose-600">${order.total.toFixed(2)}</td>
        <td className="p-4">
          <Badge className={`border flex items-center gap-1 w-fit ml-auto ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </Badge>
        </td>
        <td className="p-4 text-center text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-rose-50/50">
          <td colSpan={6} className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p className="text-sm font-medium text-gray-800">{order.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-800">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Est. Delivery</p>
                <p className="text-sm font-medium text-gray-800">{order.estimatedDelivery.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                <p className="text-sm font-medium text-gray-800">
                  {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod : 'N/A'}
                </p>
              </div>
              {order.rating && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer Rating</p>
                  <p className="text-sm font-medium text-gray-800">
                    {'⭐'.repeat(order.rating)}{order.ratingComment && ` — "${order.ratingComment}"`}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Proof */}
            {order.paymentProof && (
              <div className="mb-5 p-4 bg-white rounded-2xl border border-pink-100">
                <p className="text-xs text-gray-500 mb-3 font-semibold">Payment Proof</p>
                <div className="flex items-center gap-3">
                  <img src={order.paymentProof} alt="Payment proof" className="w-20 h-20 rounded-xl object-cover border border-pink-200" />
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Customer submitted a payment screenshot.</p>
                    <Button
                      size="sm"
                      onClick={e => { e.stopPropagation(); setShowProof(true); }}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View Full Screenshot
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {order.items.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-2 font-semibold">Order Items</p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-pink-100">
                      {item.bouquet.image && <img src={item.bouquet.image} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.bouquet.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-rose-600 text-sm">${(item.bouquet.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-rose-100">
              {/* To Pay → To Ship: needs payment proof review */}
              {order.status === 'to-pay' && (
                <div className="flex flex-wrap items-center gap-3">
                  {order.paymentMethod === 'cod' ? (
                    <Button
                      onClick={e => { e.stopPropagation(); setConfirmAdvance('to-ship'); }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" /> Accept COD Order → To Ship
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {order.paymentProof ? (
                        <Button
                          onClick={e => { e.stopPropagation(); setConfirmAdvance('to-ship'); }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Verify Payment & Move to Ship
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
                          <ImageIcon className="w-4 h-4" />
                          Waiting for customer's payment proof
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* To Ship → To Receive */}
              {order.status === 'to-ship' && (
                <Button
                  onClick={e => { e.stopPropagation(); setConfirmAdvance('to-receive'); }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Truck className="w-4 h-4 mr-2" /> Mark as Out for Delivery → To Receive
                </Button>
              )}

              {/* Cancel (only for to-pay and to-ship) */}
              {(order.status === 'to-pay' || order.status === 'to-ship') && (
                <Button
                  variant="outline"
                  onClick={e => { e.stopPropagation(); setConfirmAdvance('cancelled'); }}
                  className="border-red-200 text-red-500 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                </Button>
              )}

              {order.status === 'to-receive' && (
                <div className="text-sm text-purple-600 bg-purple-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Waiting for customer to confirm receipt
                </div>
              )}

              {(order.status === 'to-rate' || order.status === 'rated') && (
                <div className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {order.status === 'rated' ? `Completed — rated ${order.rating}⭐` : 'Delivered — awaiting customer rating'}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function OrderManagement() {
  const { orders } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = orders.filter(o => {
    const matchSearch = o.id.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const counts = Object.fromEntries(
    STATUS_OPTIONS.slice(1).map(s => [s.value, orders.filter(o => o.status === s.value).length])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <p className="text-gray-500 text-sm">{orders.length} total orders</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.slice(1).map(s => {
          const cfg = STATUS_CONFIG[s.value];
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
              className={`rounded-xl p-3 border text-center transition-all hover:scale-105 ${
                statusFilter === s.value ? cfg.color + ' border-2' : 'bg-white border-pink-100 hover:border-rose-200'
              }`}
            >
              <p className="text-2xl font-bold text-gray-800">{counts[s.value] || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, name, or email..." className="pl-10 border-pink-200" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 border-pink-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rose-50 border-b border-rose-100">
              <tr>
                <th className="text-left p-4 text-gray-600 font-semibold">Order ID</th>
                <th className="text-left p-4 text-gray-600 font-semibold">Customer</th>
                <th className="text-left p-4 text-gray-600 font-semibold hidden md:table-cell">Date / Payment</th>
                <th className="text-right p-4 text-gray-600 font-semibold">Total</th>
                <th className="text-right p-4 text-gray-600 font-semibold">Status</th>
                <th className="p-4 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => <OrderRow key={o.id} order={o} />)}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No orders found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
