import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, MapPin, User, Upload, Banknote, Wallet, Truck, X, ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { toast } from 'sonner';
import { PaymentMethod } from '../types';

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
  const { cart, getCartTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', zipCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setProofFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeProof = () => { setProofFile(null); setProofFileName(''); if (fileRef.current) fileRef.current.value = ''; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields'); return;
    }
    if ((paymentMethod === 'e-wallet' || paymentMethod === 'bank-transfer') && !proofFile) {
      toast.error('Please upload your payment proof screenshot'); return;
    }

    const subtotal = getCartTotal();
    const deliveryFee = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + deliveryFee;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);

    setSubmitting(true);
    try {
      // The API expects bouquet ids (it re-reads the price from the database),
      // so map the cart down to plain item references before creating the order.
      const orderId = await createOrder({
        items: cart.map(item => ({
          bouquet: item.bouquet.id,
          quantity: item.quantity,
          customMessage: item.customMessage || '',
          deliveryDate: item.deliveryDate || '',
        })),
        total,
        status: 'to-pay',
        customerName: formData.fullName,
        deliveryAddress: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
        phone: formData.phone,
        email: formData.email,
        estimatedDelivery,
        paymentMethod,
        paymentProof: proofFile || undefined,
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error('We could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) { navigate('/cart'); return null; }

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

                      <div>
                        <Label className="text-gray-700 font-semibold">
                          Upload Payment Proof * <span className="text-xs text-gray-400 font-normal">(screenshot/receipt)</span>
                        </Label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />

                        {!proofFile ? (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="mt-2 w-full border-2 border-dashed border-pink-300 rounded-2xl p-8 text-center hover:border-rose-400 hover:bg-rose-50 transition-all group"
                          >
                            <Upload className="w-8 h-8 text-pink-400 mx-auto mb-2 group-hover:text-rose-500" />
                            <p className="text-gray-600 font-medium">Click to upload payment screenshot</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF accepted</p>
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
                          <p className="font-bold text-rose-600 text-sm shrink-0">${(item.bouquet.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-pink-100" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery</span>
                        <span>{deliveryFee === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `$${deliveryFee.toFixed(2)}`}</span>
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
                        <span className="text-rose-600">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white">
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
