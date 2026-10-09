import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, TrackingUpdate } from '../types';
import { orderApi } from '../api/client';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'trackingUpdates'>) => Promise<string>;
  getOrder: (orderId: string) => Promise<Order | undefined>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  rateOrder: (orderId: string, rating: number, comment: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'trackingUpdates'>) => {
    try {
      const res = await orderApi.create(orderData);
      setOrders(prev => [res, ...prev]);
      return res.id;
    } catch (err) {
      console.error('Create order failed:', err);
      throw err;
    }
  };

  const getOrder = async (orderId: string) => {
    try {
      return await orderApi.getOne(orderId);
    } catch {
      return orders.find(o => o.id === orderId);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await orderApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? res : o));
    } catch (err) {
      console.error('Update order status failed:', err);
    }
  };

  const rateOrder = async (orderId: string, rating: number, comment: string) => {
    try {
      const res = await orderApi.rate(orderId, rating, comment);
      setOrders(prev => prev.map(o => o.id === orderId ? res : o));
    } catch (err) {
      console.error('Rate order failed:', err);
    }
  };

  const refetch = async () => {
    await fetchOrders();
  };

  return (
    <OrderContext.Provider value={{ orders, isLoading, createOrder, getOrder, updateOrderStatus, rateOrder, refetch }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
