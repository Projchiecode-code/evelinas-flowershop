import { useState } from 'react';
import { Bell, X, ShoppingBag, Star, Megaphone, Settings, CheckCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';

const TYPE_CONFIG: Record<AppNotification['type'], { icon: React.ReactNode; color: string }> = {
  order:  { icon: <ShoppingBag className="w-4 h-4" />,  color: 'bg-blue-100 text-blue-600' },
  review: { icon: <Star className="w-4 h-4" />,         color: 'bg-yellow-100 text-yellow-600' },
  promo:  { icon: <Megaphone className="w-4 h-4" />,    color: 'bg-purple-100 text-purple-600' },
  system: { icon: <Settings className="w-4 h-4" />,     color: 'bg-gray-100 text-gray-600' },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearNotification } = useNotifications();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClick = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl border border-pink-200 hover:border-rose-400 hover:bg-rose-50 transition-all"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-rose-500' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-pink-100 z-40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              <button onClick={markAllRead} className="text-white/70 hover:text-white text-xs flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> All read
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-rose-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type];
                  return (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-rose-50/50 transition-colors ${!n.read ? 'bg-rose-50/30' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleClick(n)}>
                        {n.link ? (
                          <Link to={n.link} onClick={() => handleClick(n)}>
                            <p className={`text-sm font-semibold text-gray-800 leading-tight ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </Link>
                        ) : (
                          <>
                            <p className={`text-sm text-gray-800 leading-tight ${!n.read ? 'font-bold' : 'font-semibold'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </>
                        )}
                        <p className="text-xs text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {!n.read && <span className="w-2 h-2 bg-rose-500 rounded-full" />}
                        {/* Broadcasts are shared — customers can't delete them
                            (clicking marks them read); admins can clean up. */}
                        {(!n.broadcast || isAdmin) && (
                          <button onClick={() => clearNotification(n.id)} className="text-gray-200 hover:text-gray-400 p-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
