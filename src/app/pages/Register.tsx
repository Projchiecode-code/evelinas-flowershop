import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Flower2, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="relative bg-gradient-to-r from-purple-600 to-rose-500 p-8 pt-10 text-center">
            <Link
              to="/login"
              aria-label="Back to sign in"
              className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white text-xs font-semibold px-3 py-2 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">Create Account</h1>
            <p className="text-rose-100 text-sm mt-1">Join Evelina's Flowershop today</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Full Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="border-pink-200 focus:border-rose-400"
                />
              </div>
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
                    placeholder="At least 6 characters"
                    required
                    className="border-pink-200 focus:border-rose-400 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Confirm Password</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="border-pink-200 focus:border-rose-400"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white h-11"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">🌸</span> Creating account...</span>
                ) : (
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create Account</span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-rose-100">
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-rose-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Evelina's Flowershop
          </Link>
        </p>
      </div>
    </div>
  );
}
