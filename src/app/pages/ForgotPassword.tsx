import { useState } from 'react';
import { Link } from 'react-router';
import { Flower2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">Forgot Password</h1>
            <p className="text-rose-100 text-sm mt-1">Evelina's Flowershop</p>
          </div>

          <div className="p-8">
            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="font-bold text-gray-800 text-lg mb-2">Check your email!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
                </p>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white">Back to Sign In</Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-10 border-pink-200 focus:border-rose-400" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white h-11">
                    {loading ? '🌸 Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/login" className="hover:text-rose-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
