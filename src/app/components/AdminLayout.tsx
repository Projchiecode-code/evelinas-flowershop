import { Link, Outlet, useLocation, Navigate } from 'react-router';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Flower2, ChevronRight, Zap, MessageSquare, Camera, Bell, BarChart3, ChevronDown, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
  {
    label: 'Products', icon: <Package className="w-4 h-4" />, children: [
      { to: '/admin/products', label: 'Bouquet Management' },
    ]
  },
  {
    label: 'Orders', icon: <ShoppingBag className="w-4 h-4" />, children: [
      { to: '/admin/orders', label: 'Order Management' },
    ]
  },
  {
    label: 'AI & Reviews', icon: <Zap className="w-4 h-4" />, children: [
      { to: '/admin/recommendations', label: 'Recommendation Rules' },
      { to: '/admin/reviews', label: 'Reviews' },
      { to: '/admin/gallery', label: 'Gallery' },
    ]
  },
  {
    label: 'Notifications', icon: <Bell className="w-4 h-4" />, children: [
      { to: '/admin/notifications', label: 'Email Notifications' },
    ]
  },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
];

function NavItem({ item }: { item: typeof NAV[number] }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if ('children' in item) return item.children.some(c => location.pathname.startsWith(c.to));
    return false;
  });

  if ('to' in item) {
    const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
    return (
      <Link to={item.to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${active ? 'bg-white/20 text-white' : 'text-rose-100 hover:bg-white/10 hover:text-white'}`}>
        {item.icon}
        <span className="font-medium text-sm">{item.label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
      </Link>
    );
  }

  const anyActive = item.children.some(c => location.pathname.startsWith(c.to));
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${anyActive ? 'bg-white/10 text-white' : 'text-rose-100 hover:bg-white/10 hover:text-white'}`}>
        {item.icon}
        <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map(child => {
            const active = location.pathname === child.to;
            return (
              <Link key={child.to} to={child.to} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'text-white font-semibold' : 'text-rose-200 hover:text-white'}`}>
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminLayout() {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();
  // Off-canvas sidebar on phones: the fixed 240px rail used to overlap the
  // content (ml-60 on a 390px screen left ~150px of usable width).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  // Wait for /auth/me before judging the role — otherwise refreshing /admin
  // bounces a signed-in owner to the login page (user is null mid-load).
  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-rose-50 flex">
      {/* Scrim behind the drawer (mobile only) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — drawer below md, fixed rail from md up */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-gradient-to-b from-rose-600 via-pink-600 to-purple-700 text-white flex flex-col z-40 shadow-xl transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-white/20 rounded-xl p-2 group-hover:bg-white/30 transition-colors">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Evelina's Flowershop</p>
              <p className="text-xs text-rose-200">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => <NavItem key={i} item={item} />)}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs truncate">{user?.name}</p>
              <p className="text-xs text-rose-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-100 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* min-w-0: without it main's auto min-width (charts/grids inside)
          inflates the flex item past the phone viewport → page-wide scroll */}
      <main className="flex-1 min-w-0 min-h-screen md:ml-60">
        {/* Activity bar — the shop owner sees new orders and status traffic here */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-4 bg-white/70 backdrop-blur border-b border-pink-100">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 truncate">Live shop activity</p>
          </div>
          <NotificationBell />
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
