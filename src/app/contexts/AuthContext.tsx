import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  joinedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = (await authApi.me()) as User;
        setUser(res);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = (await authApi.login({ email, password })) as { user: User };
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = (await authApi.register({ name, email, password })) as { user: User };
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
    setUser(null);
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
