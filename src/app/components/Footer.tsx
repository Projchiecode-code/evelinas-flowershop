import { Flower2, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Flower2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">The Flower Shop</h3>
                <p className="text-xs">AI-Powered Floristry</p>
              </div>
            </div>
            <p className="text-sm mb-4">
              Delivering beautiful, fresh bouquets with personalized recommendations and real-time tracking.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-purple-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="hover:text-purple-400 transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-purple-400 transition-colors">
                  AI Recommendations
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-purple-400 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-purple-400 transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Occasions */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop by Occasion</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop?occasion=Birthday" className="hover:text-purple-400 transition-colors">
                  Birthday
                </Link>
              </li>
              <li>
                <Link to="/shop?occasion=Wedding" className="hover:text-purple-400 transition-colors">
                  Wedding
                </Link>
              </li>
              <li>
                <Link to="/shop?occasion=Romance" className="hover:text-purple-400 transition-colors">
                  Romance
                </Link>
              </li>
              <li>
                <Link to="/shop?occasion=Sympathy" className="hover:text-purple-400 transition-colors">
                  Sympathy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@theflowershop.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Blossom Street<br />Garden City, FL 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2026 The Flower Shop. All rights reserved.</p>
          <p className="text-xs text-gray-500 mt-2">
            Made with AI-powered personalization and real-time order tracking
          </p>
        </div>
      </div>
    </footer>
  );
}
