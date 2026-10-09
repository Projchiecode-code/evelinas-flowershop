import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, api } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  joinedAt: Date;
  /** Contact details editable from the Profile page (PATCH /users/me). */
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Merge freshly-saved profile fields into the session user. */
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount. `api` already carries the persisted token from
  // localStorage (set at login), so /auth/me authenticates via the
  // Authorization header — it works even where iOS Safari refuses the cookie.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = (await authApi.me()) as User;
        setUser(res);
      } catch (err) {
        // Only drop the stored token when the server actually rejected it —
        // a network blip shouldn't sign the user out.
        if ((err as { status?: number })?.status === 401) api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = (await authApi.login({ email, password })) as { user: User; token?: string };
      if (res.token) api.setToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = (await authApi.register({ name, email, password })) as { user: User; token?: string };
      if (res.token) api.setToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    api.setToken(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
