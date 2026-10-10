import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { CreditCard, MapPin, User, Upload, Banknote, Wallet, Truck, X, ImageIcon, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { productApi } from '../api/client';
import { toast } from 'sonner';
import { CartItem, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/currency';
import { compressImage } from '../utils/imageCompress';

/** Where a signed-out shopper goes to sign in, and back to checkout afterwards. */
const LOGIN_PATH = '/login?redirect=/checkout';

/** Error whose message is safe to show to the customer. */
class CheckoutError extends Error {}

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The storefront catalogue uses local ids ("1".."8"), while the products seeded
 * into MongoDB carry their own ObjectIds. POST /orders runs
 * `Bouquet.findById(item.bouquet)`, so a local id makes the request 500
 * ("Cast to ObjectId failed"). Translate local ids to the database ids first.
 */
async function buildOrderItems(cart: CartItem[]) {
  const byName = new Map<string, string>();

  if (cart.some(item => !OBJECT_ID.test(item.bouquet.id))) {
    let products: any[] = [];
    try {
      products = (await productApi.getAll()) as any[];
    } catch {
      products = [];
    }

    if (!Array.isArray(products) || products.length === 0) {
      throw new CheckoutError('Could not reach the product catalog — please refresh the page and try again.');
    }

    products.forEach(p => {
      const key = String(p?.name ?? '').trim().toLowerCase();
      if (key && !byName.has(key)) byName.set(key, String(p._id || p.id || ''));
    });
  }

  return Promise.all(
    cart.map(async item => {
      const localId = item.bouquet.id;
      const bouquetId = OBJECT_ID.test(localId) ? localId : byName.get(item.bouquet.name.trim().toLowerCase());

      if (!bouquetId) {
        throw new CheckoutError(`"${item.bouquet.name}" is no longer available.`);
      }

      return {
        bouquet: bouquetId,
        quantity: item.quantity,
        customMessage: item.customMessage || '',
        deliveryDate: item.deliveryDate || '',
      };
    })
  );
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'cod', label: 'Cash on Delivery', icon: <Banknote className="w-5 h-5" />, desc: 'Pay when your bouquet arrives' },
  { value: 'e-wallet', label: 'E-Wallet', icon: <Wallet className="w-5 h-5" />, desc: 'GCash, Maya, PayPal, etc.' },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: <CreditCard className="w-5 h-5" />, desc: 'Direct bank deposit / transfer' },
];

const PAYMENT_DETAILS: Record<'e-wallet' | 'bank-transfer', { title: string; lines: string[] }> = {
  'e-wallet': {
    title: 'E-Wallet Payment Details',
    lines: ['GCash: 0917-123-4567', 'Maya: 0999-876-5432', 'PayPal: payments@evelinas.com'],
  },
  'bank-transfer': {
    title: 'Bank Transfer Details',
    lines: ['BPI Savings: 1234-5678-90', 'BDO: 0987-6543-21', 'Account Name: Evelina\'s Flowershop'],
  },
};

export function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, isLoading: isCartLoading } = useCart();
  const { createOrder } = useOrders();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', zipCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [processingProof, setProcessingProof] = useState(false);
  // Receipt details for e-wallet / bank transfer — verified against the
  // screenshot by the admin before the order ships.
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set once an order exists, so the empty-cart redirect below doesn't race
  // the navigation to the confirmation page.
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error('Payment proof must be under 15 MB'); return; }
    setProcessingProof(true);
    try {
      // Downscale + re-encode in the browser so the stored screenshot stays
      // well under the server's 1.5 MB cap (and the order document stays light).
      const processed = await compressImage(file);
      setProofFile(processed);
      setProofFileName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process that image');
    } finally {
      setProcessingProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeProof = () => { setProofFile(null); setProofFileName(''); if (fileRef.current) fileRef.current.value = ''; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Orders belong to an account — POST /orders is authenticated.
    if (!isAuthenticated) {
      toast.error('Please sign in to place your order.');
      navigate(LOGIN_PATH);
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields'); return;
    }
    if (paymentMethod === 'e-wallet' || paymentMethod === 'bank-transfer') {
      if (!proofFile) { toast.error('Please upload your payment proof screenshot'); return; }
      if (!paymentRef.trim()) { toast.error('Please enter your payment reference number'); return; }
      if (!paymentAmount || Number(paymentAmount) <= 0) { toast.error('Please enter the amount you sent'); return; }
    }

    const subtotal = getCartTotal();
    const deliveryFee = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + deliveryFee;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);

    setSubmitting(true);
    try {
      // The API expects bouquet ids (it re-reads the price from the database),
      // so translate the cart's local ids before creating the order.
      const items = await buildOrderItems(cart);
      const orderId = await createOrder({
        items,
        total,
        status: 'to-pay',
        customerName: formData.fullName,
        deliveryAddress: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
        phone: formData.phone,
        email: formData.email,
        estimatedDelivery,
        paymentMethod,
        paymentProof: proofFile || undefined,
        paymentRef: paymentRef.trim() || undefined,
        paymentAmount: Number(paymentAmount) || undefined,
      });

      setPlacedOrderId(orderId);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      // Session expired between page load and submit (or the cookie was cleared).
      const status = (err as { status?: number })?.status;
      if (status === 401 || /no token|unauthorized|not authorized/i.test(String((err as Error)?.message))) {
        toast.error('Your session has expired. Please sign in again to place an order.');
        navigate(LOGIN_PATH);
        return;
      }
      // API errors carry a customer-readable message (e.g. the server's
      // "not enough stock" 409) — prefer it over a generic fallback.
      const serverMessage = status ? String((err as Error)?.message || '').trim() : '';
      toast.error(
        err instanceof CheckoutError ? err.message
          : serverMessage || 'We could not place your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // An empty cart has nothing to check out. This used to call navigate()
  // during render, which raced the post-success navigation and bounced the
  // customer back to an empty cart instead of the confirmation page — it also
  // fired on a cold load of /checkout, before the cart finished restoring
  // from localStorage, kicking deep links back to /cart.
  useEffect(() => {
    if (isCartLoading || placedOrderId || submitting) return;
    if (cart.length === 0) navigate('/cart');
  }, [isCartLoading, cart.length, placedOrderId, submitting, navigate]);

  if (isCartLoading || (cart.length === 0 && !placedOrderId)) return null;

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + deliveryFee;
  const needsProof = paymentMethod === 'e-wallet' || paymentMethod === 'bank-transfer';

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-rose-100 mt-1">Complete your order from Evelina's Flowershop</p>
        </div>
      </div>

      {/* Signed-out shoppers are told up front, not after filling the form. */}
      {!isAuthLoading && !isAuthenticated && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 flex-1 min-w-[200px]">
              <span className="font-semibold">Sign in to place your order.</span>{' '}
              You need an account to check out — your cart and details will be waiting when you get back.
            </p>
            <Link
              to={LOGIN_PATH}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
            >
              <LogIn className="w-4 h-4" /> Sign In to Continue
            </Link>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card className="border-pink-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <User className="w-5 h-5 text-rose-500" /> Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-gray-700">Full Name *</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInput} required className="border-pink-200 focus:border-rose-400 mt-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-gray-700">Email *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInput} required className="border-pink-200 focus:border-rose-400 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700">Phone *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInput} required className="border-pink-200 focus:border-rose-400 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="border-pink-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <MapPin className="w-5 h-5 text-rose-500" /> Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="text-gray-700">Street Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInput} required className="border-pink-200 focus:border-rose-400 mt-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-gray-700">City *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleInput} required className="border-pink-200 focus:border-rose-400 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-gray-700">ZIP Code</Label>
                      <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInput} className="border-pink-200 focus:border-rose-400 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-pink-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <CreditCard className="w-5 h-5 text-rose-500" /> Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {PAYMENT_OPTIONS.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === opt.value
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-pink-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.value}
                          checked={paymentMethod === opt.value}
                          onChange={() => { setPaymentMethod(opt.value); removeProof(); }}
                          className="accent-rose-500 w-4 h-4"
                        />
                        <div className={`p-2 rounded-xl ${paymentMethod === opt.value ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                          {opt.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Payment details + proof upload for non-COD */}
                  {needsProof && (
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                        <p className="font-semibold text-purple-800 mb-2">
                          {PAYMENT_DETAILS[paymentMethod as 'e-wallet' | 'bank-transfer'].title}
                        </p>
                        {PAYMENT_DETAILS[paymentMethod as 'e-wallet' | 'bank-transfer'].lines.map(line => (
                          <p key={line} className="text-sm text-purple-700">{line}</p>
                        ))}
                      </div>

                      {/* Receipt details — the shop checks these against the screenshot */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="paymentRef" className="text-gray-700 font-semibold">
                            Reference Number * <span className="text-xs text-gray-400 font-normal">(from your receipt)</span>
                          </Label>
                          <Input
                            id="paymentRef"
                            value={paymentRef}
                            onChange={e => setPaymentRef(e.target.value)}
                            placeholder="e.g. 123456789012"
                            maxLength={64}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentAmount" className="text-gray-700 font-semibold">
                            Amount Sent (₱) *
                          </Label>
                          <Input
                            id="paymentAmount"
                            type="number"
                            min={1}
                            step="0.01"
                            inputMode="decimal"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            placeholder={`e.g. ${total.toFixed(2)}`}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 -mt-1">
                        Type these exactly as they appear on your receipt — the shop verifies them against your screenshot before shipping.
                      </p>

                      <div>
                        <Label className="text-gray-700 font-semibold">
                          Upload Payment Proof * <span className="text-xs text-gray-400 font-normal">(screenshot/receipt)</span>
                        </Label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />

                        {!proofFile ? (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={processingProof}
                            className="mt-2 w-full border-2 border-dashed border-pink-300 rounded-2xl p-8 text-center hover:border-rose-400 hover:bg-rose-50 transition-all group disabled:opacity-60"
                          >
                            {processingProof ? (
                              <>
                                <Loader2 className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-spin" />
                                <p className="text-gray-600 font-medium">Optimizing screenshot…</p>
                                <p className="text-xs text-gray-400 mt-1">Shrinking it for faster upload</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-pink-400 mx-auto mb-2 group-hover:text-rose-500" />
                                <p className="text-gray-600 font-medium">Click to upload payment screenshot</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF accepted</p>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="mt-2 relative rounded-2xl overflow-hidden border-2 border-rose-300">
                            <img src={proofFile} alt="Payment proof" className="w-full max-h-64 object-contain bg-gray-50" />
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                ✓ Uploaded
                              </div>
                              <button type="button" onClick={removeProof} className="bg-white rounded-full p-1 shadow-md hover:bg-red-50">
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                            <div className="px-4 py-2 bg-white border-t border-pink-100">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> {proofFileName}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <Truck className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>Cash on Delivery:</strong> Please prepare the exact amount. Our rider will collect payment upon delivery.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 border-pink-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-800">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.bouquet.id} className="flex gap-3">
                          <img src={item.bouquet.image} alt={item.bouquet.name} className="w-16 h-16 object-cover rounded-xl border border-pink-100" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">{item.bouquet.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-rose-600 text-sm shrink-0">{formatCurrency(item.bouquet.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-pink-100" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery</span>
                        <span>{deliveryFee === 0 ? <span className="text-green-600 font-semibold">FREE</span> : formatCurrency(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-gray-500">Payment</span>
                        <span className="text-xs font-medium text-purple-600 capitalize">
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'e-wallet' ? 'E-Wallet' : 'Bank Transfer'}
                        </span>
                      </div>
                      <Separator className="bg-pink-100" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-rose-600">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <Button type="submit" size="lg" disabled={submitting || processingProof} className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white">
                      {submitting ? (
                        <span className="flex items-center gap-2"><span className="animate-spin">🌸</span> Placing order...</span>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                    <p className="text-xs text-gray-400 text-center">By placing this order you agree to our terms</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
