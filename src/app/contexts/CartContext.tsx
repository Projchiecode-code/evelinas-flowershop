import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Bouquet } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (bouquet: Bouquet, quantity: number, customMessage?: string, deliveryDate?: string) => void;
  removeFromCart: (bouquetId: string) => void;
  updateQuantity: (bouquetId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

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
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
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
