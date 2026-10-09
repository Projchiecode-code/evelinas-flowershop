import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppNotification } from '../types';

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const INITIAL: AppNotification[] = [
  { id: 'n1', title: 'Order Confirmed! 🌸', message: 'Your order ORD-DEMO-002 has been accepted and is now being prepared.', type: 'order', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000), link: '/track' },
  { id: 'n2', title: 'Payment Verified ✅', message: 'Your e-wallet payment has been verified by our team.', type: 'order', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), link: '/track' },
  { id: 'n3', title: 'Your Review is Live! ⭐', message: 'Your review for Pink Rose Elegance has been approved and is now public.', type: 'review', read: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), link: '/catalog' },
  { id: 'n4', title: 'Weekend Flash Sale 🎉', message: '20% off all bouquets this weekend only! Use code BLOOM20 at checkout.', type: 'promo', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), link: '/catalog' },
  { id: 'n5', title: "Mother's Day Pre-Order Open 💐", message: "Secure your Mother's Day bouquets early! Limited stock available.", type: 'promo', read: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), link: '/catalog' },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications(prev => [{
      ...data, id: `n-${Date.now()}`, createdAt: new Date(), read: false,
    }, ...prev]);
  };

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const clearNotification = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
