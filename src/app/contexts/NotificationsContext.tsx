import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppNotification } from '../types';
import { notificationApi } from '../api/client';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = (await notificationApi.getAll()) as AppNotification[];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // /notifications requires a session cookie — skip it while signed out so
  // anonymous visits don't log a 401 on every page load.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    fetchNotifications();
  }, [isAuthLoading, isAuthenticated, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const res = (await notificationApi.create(data)) as AppNotification;
      setNotifications(prev => [res, ...prev]);
    } catch (err) {
      console.error('Add notification failed:', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  const refetch = async () => {
    await fetchNotifications();
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, isLoading, addNotification, markRead, markAllRead, clearNotification, refetch }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
