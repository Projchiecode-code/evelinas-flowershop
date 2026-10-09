import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, OrderPayload } from '../types';
import { orderApi } from '../api/client';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  createOrder: (order: OrderPayload) => Promise<string>;
  getOrder: (orderId: string) => Promise<Order | undefined>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  rateOrder: (orderId: string, rating: number, comment: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// The API returns raw Mongo documents (`_id`, ISO date strings, populated
// sub-documents). Everything downstream (charts, revenue math, order pages)
// expects the `Order` shape (`id`, real Date objects), so normalise once here.
function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(value as string | number);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    ...raw,
    id: raw?.id || raw?._id || '',
    total: Number(raw?.total) || 0,
    status: (raw?.status || 'to-pay') as OrderStatus,
    createdAt: toDate(raw?.createdAt),
    estimatedDelivery: toDate(raw?.estimatedDelivery),
    trackingUpdates: (Array.isArray(raw?.trackingUpdates) ? raw.trackingUpdates : []).map((t: any) => ({
      ...t,
      timestamp: toDate(t?.timestamp),
    })),
    items: items.map((item: any) => ({
      ...item,
      quantity: Number(item?.quantity) || 1,
      price: Number(item?.price) || 0,
      bouquet: item?.bouquet
        ? { ...item.bouquet, id: item.bouquet.id || item.bouquet._id || '' }
        : item.bouquet,
    })),
  } as Order;
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderApi.getAll();
      setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
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

  const createOrder = async (orderData: OrderPayload) => {
    const res = await orderApi.create(orderData);
    const order = normalizeOrder(res);
    setOrders(prev => [order, ...prev]);
    return order.id;
  };

  const getOrder = async (orderId: string) => {
    try {
      const res = await orderApi.getOne(orderId);
      return normalizeOrder(res);
    } catch {
      return orders.find(o => o.id === orderId);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await orderApi.updateStatus(orderId, status);
      const updated = normalizeOrder(res);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      console.error('Update order status failed:', err);
    }
  };

  const rateOrder = async (orderId: string, rating: number, comment: string) => {
    try {
      const res = await orderApi.rate(orderId, rating, comment);
      const updated = normalizeOrder(res);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
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
