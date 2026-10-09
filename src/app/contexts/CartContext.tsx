import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Bouquet } from '../types';
import { authApi } from '../api/client';

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (bouquet: Bouquet, quantity: number, customMessage?: string, deliveryDate?: string) => void;
  removeFromCart: (bouquetId: string) => void;
  updateQuantity: (bouquetId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'evelinas_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Sync cart with backend when user logs in
  const syncCart = async () => {
    try {
      // Could implement backend cart sync here if needed
      // For now, we rely on localStorage
    } catch (err) {
      console.error('Cart sync failed:', err);
    }
  };

  const addToCart = (bouquet: Bouquet, quantity: number, customMessage?: string, deliveryDate?: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.bouquet.id === bouquet.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.bouquet.id === bouquet.id
            ? { ...item, quantity: item.quantity + quantity, customMessage, deliveryDate }
            : item
        );
      }
      return [...prevCart, { bouquet, quantity, customMessage, deliveryDate }];
    });
  };

  const removeFromCart = (bouquetId: string) => {
    setCart(prevCart => prevCart.filter(item => item.bouquet.id !== bouquetId));
  };

  const updateQuantity = (bouquetId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bouquetId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.bouquet.id === bouquetId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.bouquet.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
