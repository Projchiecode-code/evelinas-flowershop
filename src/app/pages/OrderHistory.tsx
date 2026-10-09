import { Link } from 'react-router';
import { Package, CreditCard, Truck, Star, CheckCircle, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useOrders } from '../contexts/OrderContext';
import { OrderStatus } from '../types';
import { formatCurrency } from '../utils/currency';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
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

export function OrderHistory() {
  const { orders } = useOrders();
  const sorted = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-rose-200" />
          <h1 className="text-4xl font-bold mb-2">Order History</h1>
          <p className="text-rose-100">All your orders from Evelina's Flowershop</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-16 text-center">
            <ShoppingBag className="w-16 h-16 text-pink-200 mx-auto mb-4" />
            <h2 className="font-bold text-gray-700 text-xl mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">Start shopping and your orders will appear here.</p>
            <Link to="/catalog"><Button className="bg-rose-500 hover:bg-rose-600 text-white">Browse Catalog</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-rose-50 border-b border-pink-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                      <p className="font-bold text-gray-800 font-mono text-sm">{order.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`border flex items-center gap-1 ${cfg.color}`}>{cfg.icon}{cfg.label}</Badge>
                      <Link to={`/track`}>
                        <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs">
                          Track <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="p-5">
                    {order.items.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.bouquet?.image ? (
                              <img src={item.bouquet.image} alt={item.bouquet.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-dashed border-pink-200 flex items-center justify-center shrink-0">🌸</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{item.bouquet?.name || 'Product no longer available'}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-rose-600 text-sm">{formatCurrency((item.bouquet?.price ?? item.price ?? 0) * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mb-4 italic">Demo order</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-rose-50 text-sm">
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>{order.createdAt.toLocaleDateString()}</span>
                        {order.paymentMethod && <span className="text-purple-600">{PAYMENT_LABEL[order.paymentMethod]}</span>}
                      </div>
                      <p className="font-bold text-rose-600 text-lg">{formatCurrency(order.total)}</p>
                    </div>

                    {order.rating && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600">
                        {'⭐'.repeat(order.rating)} <span className="text-gray-500 italic">"{order.ratingComment}"</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
