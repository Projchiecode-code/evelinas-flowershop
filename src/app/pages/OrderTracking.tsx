import { useState } from 'react';
import { CreditCard, Package, Truck, Star, CheckCircle, Clock, MapPin, AlertTriangle, ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useOrders } from '../contexts/OrderContext';
import { Order, OrderStatus } from '../types';

type Tab = 'to-pay' | 'to-ship' | 'to-receive' | 'to-rate';

const TABS: { key: Tab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { key: 'to-pay',     label: 'To Pay',     icon: <CreditCard className="w-4 h-4" />, color: 'text-amber-600',  activeColor: 'border-amber-500 bg-amber-50 text-amber-700' },
  { key: 'to-ship',    label: 'To Ship',    icon: <Package className="w-4 h-4" />,    color: 'text-blue-600',   activeColor: 'border-blue-500 bg-blue-50 text-blue-700' },
  { key: 'to-receive', label: 'To Receive', icon: <Truck className="w-4 h-4" />,      color: 'text-purple-600', activeColor: 'border-purple-500 bg-purple-50 text-purple-700' },
  { key: 'to-rate',    label: 'To Rate',    icon: <Star className="w-4 h-4" />,       color: 'text-green-600',  activeColor: 'border-green-500 bg-green-50 text-green-700' },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  'to-pay': 'Awaiting Payment', 'to-ship': 'Being Prepared',
  'to-receive': 'Out for Delivery', 'to-rate': 'Delivered',
  'rated': 'Completed', 'cancelled': 'Cancelled',
};

const PAYMENT_LABEL: Record<string, string> = {
  'cod': 'Cash on Delivery', 'e-wallet': 'E-Wallet', 'bank-transfer': 'Bank Transfer',
};

function ProofModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100">
          <p className="font-bold text-gray-800">Payment Proof</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4 bg-gray-50">
          <img src={src} alt="Payment proof" className="w-full rounded-xl object-contain max-h-96" />
        </div>
      </div>
    </div>
  );
}

function RatingSection({ orderId, onRate }: { orderId: string; onRate: (r: number, c: string) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
        <p className="text-green-700 font-semibold">Thank you for your feedback! 🌸</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-rose-50 to-purple-50 rounded-2xl border border-rose-200">
      <p className="font-bold text-gray-800 text-center mb-3">Share your experience (optional)</p>
      <div className="flex justify-center gap-2 mb-3">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="transition-transform hover:scale-125">
            <Star className={`w-7 h-7 ${(hover || rating) >= n ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment} onChange={e => setComment(e.target.value)}
        placeholder="Tell us about your bouquet and delivery..."
        rows={2} className="w-full border border-rose-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-rose-400 bg-white mb-3"
      />
      <div className="flex gap-2">
        <Button
          disabled={rating === 0}
          onClick={() => { onRate(rating, comment); setSubmitted(true); }}
          className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white"
        >
          Submit Review
        </Button>
        <Button variant="outline" onClick={() => { onRate(0, ''); setSubmitted(true); }} className="border-gray-200 text-gray-500">
          Skip
        </Button>
      </div>
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">Confirm Receipt?</h3>
          <p className="text-gray-500 text-sm">Please confirm that you have received your order in good condition.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1 border-gray-200">Not Yet</Button>
          <Button onClick={onConfirm} className="flex-1 bg-green-500 hover:bg-green-600 text-white">Yes, Received!</Button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">Cancel Order?</h3>
          <p className="text-gray-500 text-sm">This action cannot be undone. Are you sure you want to cancel this order?</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1 border-gray-200">Keep Order</Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Cancel Order</Button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, tab }: { order: Order; tab: Tab }) {
  const { updateOrderStatus, rateOrder } = useOrders();
  const [showConfirmReceived, setShowConfirmReceived] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const lastUpdate = order.trackingUpdates[order.trackingUpdates.length - 1];

  const handleReceived = () => {
    updateOrderStatus(order.id, 'to-rate');
    setShowConfirmReceived(false);
    setShowRating(true);
  };

  const handleRate = (rating: number, comment: string) => {
    if (rating > 0) rateOrder(order.id, rating, comment);
    else updateOrderStatus(order.id, 'rated');
  };

  return (
    <>
      {showConfirmReceived && <ConfirmModal onConfirm={handleReceived} onCancel={() => setShowConfirmReceived(false)} />}
      {showConfirmCancel && (
        <CancelModal
          onConfirm={() => { updateOrderStatus(order.id, 'cancelled'); setShowConfirmCancel(false); }}
          onCancel={() => setShowConfirmCancel(false)}
        />
      )}
      {showProof && order.paymentProof && <ProofModal src={order.paymentProof} onClose={() => setShowProof(false)} />}

      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        {/* Order header */}
        <div className="px-5 py-4 bg-rose-50 border-b border-pink-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
            <p className="font-bold text-gray-800 font-mono text-sm">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Order Date</p>
            <p className="text-sm text-gray-700">{order.createdAt.toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Items */}
          {order.items.length > 0 && (
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.bouquet.image} alt={item.bouquet.name} className="w-14 h-14 rounded-xl object-cover border border-pink-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.bouquet.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.customMessage && <p className="text-xs text-purple-600 italic mt-0.5">💌 "{item.customMessage}"</p>}
                  </div>
                  <p className="font-bold text-rose-600 text-sm shrink-0">${(item.bouquet.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Order details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Deliver to</p>
              <p className="text-gray-700 font-medium text-xs">{order.deliveryAddress}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Est. Delivery</p>
              <p className="text-gray-700 font-medium text-xs">{order.estimatedDelivery.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Last update */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-purple-50 rounded-xl px-3 py-2">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{lastUpdate.message}</span>
              <span className="ml-auto text-gray-400">{lastUpdate.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Payment info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {order.paymentMethod && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                </Badge>
              )}
              {order.paymentProof && (
                <button onClick={() => setShowProof(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ImageIcon className="w-3 h-3" /> View Proof
                </button>
              )}
            </div>
            <p className="font-bold text-rose-600">${order.total.toFixed(2)}</p>
          </div>

          {/* Tab-specific actions */}
          <div className="pt-2 border-t border-rose-50 flex flex-wrap gap-2">
            {tab === 'to-pay' && (
              <>
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <strong>Awaiting payment verification</strong> — your order will be processed once payment is confirmed.
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowConfirmCancel(true)} className="border-red-200 text-red-500 hover:bg-red-50 shrink-0">
                  Cancel
                </Button>
              </>
            )}

            {tab === 'to-ship' && (
              <>
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                  <strong>Order confirmed!</strong> Our florists are carefully arranging your bouquet.
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowConfirmCancel(true)} className="border-red-200 text-red-500 hover:bg-red-50 shrink-0">
                  Cancel
                </Button>
              </>
            )}

            {tab === 'to-receive' && (
              <>
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                  <Truck className="w-3 h-3 inline mr-1" />
                  <strong>Your bouquet is on the way!</strong> Please be available at the delivery address.
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowConfirmReceived(true)}
                  className="bg-green-500 hover:bg-green-600 text-white shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Received
                </Button>
              </>
            )}

            {(tab === 'to-rate' || showRating) && (
              <div className="w-full">
                {order.status === 'rated' ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-green-700 font-semibold text-sm">
                      {'⭐'.repeat(order.rating || 0)} Rated!
                    </p>
                    {order.ratingComment && <p className="text-xs text-gray-500 mt-1 italic">"{order.ratingComment}"</p>}
                  </div>
                ) : (
                  <RatingSection orderId={order.id} onRate={handleRate} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function OrderTracking() {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<Tab>('to-pay');

  const tabOrders = orders.filter(o => {
    if (activeTab === 'to-rate') return o.status === 'to-rate' || o.status === 'rated';
    return o.status === activeTab;
  });

  const count = (tab: Tab) => orders.filter(o => {
    if (tab === 'to-rate') return o.status === 'to-rate' || o.status === 'rated';
    return o.status === tab;
  }).length;

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-rose-200" />
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-rose-100">Track all your orders from Evelina's Flowershop</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {TABS.map(tab => {
            const c = count(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                  isActive ? tab.activeColor + ' border-current' : 'bg-white border-pink-100 hover:border-pink-300 text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {c > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
                      {c}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold hidden sm:block">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab label */}
        <div className="flex items-center gap-2 mb-5">
          {TABS.find(t => t.key === activeTab)?.icon}
          <h2 className="font-bold text-gray-800">
            {TABS.find(t => t.key === activeTab)?.label}
          </h2>
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 ml-1">
            {tabOrders.length} order{tabOrders.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Orders */}
        {tabOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-16 text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'to-pay' ? '💳' : activeTab === 'to-ship' ? '📦' : activeTab === 'to-receive' ? '🚚' : '⭐'}
            </div>
            <p className="font-semibold text-gray-600 mb-1">No orders here</p>
            <p className="text-sm text-gray-400">Orders in this stage will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tabOrders.map(order => (
              <OrderCard key={order.id} order={order} tab={activeTab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
