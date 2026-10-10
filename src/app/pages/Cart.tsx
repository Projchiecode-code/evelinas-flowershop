import { Link } from 'react-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/currency';

/**
 * Units left for a cart line. Carts persist across sessions, so an item saved
 * before stock tracking carries no `stock` — treat that as unlimited here and
 * let the server enforce the real limit at checkout.
 */
const stockOf = (item: { bouquet: { stock?: number } }) =>
  typeof item.bouquet.stock === 'number' ? item.bouquet.stock : Infinity;

export function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add some beautiful bouquets to get started!
          </p>
          <Link to="/shop">
            <Button size="lg">Browse Bouquets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.bouquet.id}>
                <CardContent className="p-4 sm:p-6">
                  {/* min-w-0 + shrink-0 on the controls: without them long
                      names / big prices can't shrink below their min-content
                      width, so the whole column overflowed the card on narrow
                      screens and the price and delete button collided. */}
                  <div className="flex gap-3 sm:gap-6">
                    <img
                      src={item.bouquet.image}
                      alt={item.bouquet.name}
                      className="w-20 h-20 sm:w-32 sm:h-32 shrink-0 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <Link
                            to={`/bouquet/${item.bouquet.id}`}
                            className="text-lg font-semibold hover:text-purple-600 transition-colors break-words"
                          >
                            {item.bouquet.name}
                          </Link>
                          <p className="text-sm text-gray-600 break-words">
                            {item.bouquet.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.bouquet.id)}
                          aria-label={`Remove ${item.bouquet.name} from cart`}
                          className="text-red-500 hover:text-red-700 transition-colors shrink-0 self-start p-1 -m-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {item.deliveryDate && (
                        <p className="text-sm text-gray-600 mb-2 break-words">
                          📅 Delivery: {new Date(item.deliveryDate).toLocaleDateString()}
                        </p>
                      )}

                      {item.customMessage && (
                        <p className="text-sm text-gray-600 mb-2 italic break-words">
                          💌 "{item.customMessage}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                        <div className="shrink-0">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.bouquet.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.bouquet.id, item.quantity + 1)}
                              disabled={item.quantity >= stockOf(item)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {/* Stock surfaced right where quantity is chosen — the
                              server re-checks at checkout regardless. */}
                          {item.quantity > stockOf(item) && (
                            <p className="mt-1 text-xs text-amber-600 font-medium">
                              Only {stockOf(item)} in stock — reduce the quantity to check out
                            </p>
                          )}
                          {item.quantity <= stockOf(item) && stockOf(item) <= 5 && (
                            <p className="mt-1 text-xs text-amber-600 font-medium">
                              Only {stockOf(item)} left
                            </p>
                          )}
                        </div>

                        <div className="text-right min-w-0">
                          <p className="text-sm text-gray-500 break-words">
                            {formatCurrency(item.bouquet.price)} each
                          </p>
                          <p className="text-xl font-bold text-purple-600 break-words">
                            {formatCurrency(item.bouquet.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatCurrency(deliveryFee)
                      )}
                    </span>
                  </div>
                  
                  {deliveryFee > 0 && (
                    <p className="text-sm text-gray-500">
                      💡 Spend {formatCurrency(100 - subtotal)} more for free delivery!
                    </p>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Link to="/checkout">
                  <Button size="lg" className="w-full mb-4">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <Link to="/shop">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Order Benefits</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      ✓ Real-time order tracking
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Same-day delivery available
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ 100% freshness guarantee
                    </li>
                    <li className="flex items-center gap-2">
                      ✓ Secure payment processing
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
