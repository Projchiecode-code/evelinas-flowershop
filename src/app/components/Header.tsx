import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, Search, Flower2, LogOut, LayoutDashboard, Menu, X, Heart, User, History } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { NotificationBell } from './NotificationBell';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { getCartCount } = useCart();
  const { favorites } = useFavorites();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = getCartCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search)}`);
  };

  const isActive = (path: string) => location.pathname === path;

  const NAV = [
    { to: '/', label: 'Home' },
    { to: '/catalog', label: 'Catalog' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/recommendations', label: 'AI Picks ✨' },
    { to: '/track', label: 'Track Order' },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-br from-rose-500 to-purple-600 p-2 rounded-xl">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-rose-600 leading-tight">Evelina's Flowershop</p>
              <p className="text-xs text-gray-400">AI-Powered Floristry</p>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bouquets..."
                className="pl-10 border-pink-200 focus:border-rose-400"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Bell stays visible on phones — notifications must be reachable */}
            <NotificationBell />
            <Link to="/favorites" className="relative hidden sm:block">
              <Button size="sm" variant="outline" className="border-pink-200 text-rose-500 hover:bg-rose-50">
                <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-rose-400 text-rose-500' : ''}`} />
                {favorites.length > 0 && (
                  <span className="ml-1.5 text-xs font-bold">{favorites.length}</span>
                )}
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white">
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-pink-200 hover:border-rose-400 hover:bg-rose-50 transition-all"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.name.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
                    {user?.name.split(' ')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-pink-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 bg-rose-50 border-b border-pink-100">
                        <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-purple-500" /> Admin Panel
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                        <User className="w-4 h-4 text-blue-500" /> My Profile
                      </Link>
                      <Link to="/order-history" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                        <History className="w-4 h-4 text-rose-500" /> Order History
                      </Link>
                      <Link to="/track" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                        <ShoppingCart className="w-4 h-4 text-pink-500" /> Track Order
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-rose-500 text-white hover:from-purple-600 hover:to-rose-600">Register</Button>
                </Link>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex border-t border-rose-50">
          <ul className="flex items-center gap-1 py-2">
            {NAV.map(n => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(n.to) ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-rose-50 py-4 space-y-1">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 border-pink-200" />
              </div>
            </form>
            {NAV.map(n => (
              <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(n.to) ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'}`}>
                {n.label}
              </Link>
            ))}
            {/* Favorites lives in the menu too — its header button is sm+ only */}
            <Link to="/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
              <Heart className="w-4 h-4" /> Favorites
            </Link>
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full border-rose-200 text-rose-600">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-rose-500 text-white">Register</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
