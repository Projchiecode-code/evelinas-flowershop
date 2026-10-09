import { Link } from 'react-router';
import { Flower2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/button';

/**
 * Honest by design: the shop has no mail service, so this page used to fake a
 * "reset link sent" confirmation that could never arrive. It now says what
 * actually happens — the shop team resets the password manually.
 */
export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">Forgot Password</h1>
            <p className="text-rose-100 text-sm mt-1">Evelina's Flowershop</p>
          </div>

          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Resets are handled by our team</h2>
            <p className="text-gray-500 text-sm mb-6">
              Password reset emails aren't set up yet — we don't want to promise a link that
              never arrives. Message the shop or ask the admin, and we'll reset your password
              for you. Then you can sign in below.
            </p>
            <Link to="/login">
              <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white h-11">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
