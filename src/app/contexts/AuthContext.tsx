import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@flowershop.com',
    password: 'admin123',
    role: 'admin',
    joinedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    role: 'customer',
    joinedAt: new Date('2024-06-01'),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState(MOCK_USERS);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const found = registeredUsers.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    if (registeredUsers.find(u => u.email === email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser: User & { password: string } = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'customer',
      joinedAt: new Date(),
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    return { success: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
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
