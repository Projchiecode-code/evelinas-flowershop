import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Flower2, Eye, EyeOff, LogIn, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          {/* Top gradient */}
          <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">Welcome Back</h1>
            <p className="text-rose-100 text-sm mt-1">Sign in to Evelina's Flowershop</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-pink-200 focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-pink-200 focus:border-rose-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white h-11"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">🌸</span> Signing in...</span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-rose-100">
              <p className="text-center text-sm text-gray-500 mb-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-rose-600 font-semibold hover:underline">Create one</Link>
              </p>

              {/* Demo credentials */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-purple-700 mb-2">Demo Credentials</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>👑 <strong>Admin:</strong> admin@flowershop.com / admin123</p>
                  <p>👤 <strong>Customer:</strong> jane@example.com / password123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/" className="hover:text-rose-600 transition-colors">← Back to Evelina's Flowershop</Link>
        </p>
      </div>
    </div>
  );
}
