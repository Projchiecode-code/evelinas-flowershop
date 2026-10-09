import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { CheckCircle, Package, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useOrders } from '../contexts/OrderContext';
import { Order } from '../types';
import confetti from 'canvas-confetti';

export function OrderConfirmation() {
  const { orderId } = useParams();
  const { orders, getOrder } = useOrders();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [resolved, setResolved] = useState(false);

  // `getOrder` is async — resolve it once so the page doesn't render an
  // unfinished promise (which used to crash on `order.items.map`).
  useEffect(() => {
    let stale = false;
    const fromList = orders.find(o => o.id === orderId);
    if (fromList) {
      setOrder(fromList);
      setResolved(true);
      return;
    }
    getOrder(orderId || '')
      .then(found => { if (!stale) setOrder(found); })
      .catch(() => { /* handled below */ })
      .finally(() => { if (!stale) setResolved(true); });
    return () => { stale = true; };
  }, [orderId, orders, getOrder]);

  useEffect(() => {
    if (!order) return;
    // Celebrate with confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [order]);

  if (!resolved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <span className="inline-block animate-spin text-3xl mb-3">🌸</span>
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link to="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your order. We're preparing your beautiful bouquet!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold font-mono">{order.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Items</p>
                <div className="space-y-2 mt-2">
                  {order.items.map(item => (
                    <div key={item.bouquet.id} className="flex justify-between">
                      <span className="text-sm">
                        {item.bouquet.name} x {item.quantity}
                      </span>
                      <span className="text-sm font-semibold">
                        ${(item.bouquet.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="font-semibold">
                    {order.estimatedDelivery.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-semibold">{order.deliveryAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{order.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{order.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="max-w-4xl mx-auto mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">What happens next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="font-bold text-purple-600">1</span>
                </div>
                <h4 className="font-semibold mb-1">Order Confirmation</h4>
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation shortly
                </p>
              </div>
              <div>
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="font-bold text-purple-600">2</span>
                </div>
                <h4 className="font-semibold mb-1">Preparation</h4>
                <p className="text-sm text-gray-600">
                  Our florists will carefully arrange your bouquet
                </p>
              </div>
              <div>
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <span className="font-bold text-purple-600">3</span>
                </div>
                <h4 className="font-semibold mb-1">Delivery</h4>
                <p className="text-sm text-gray-600">
                  Track your order in real-time until delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/track?orderId=${order.id}`}>
            <Button size="lg">
              <Package className="w-5 h-5 mr-2" />
              Track Your Order
            </Button>
          </Link>
          <Link to="/shop">
            <Button size="lg" variant="outline">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
