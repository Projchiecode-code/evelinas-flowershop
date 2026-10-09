import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, OrderStatus, TrackingUpdate } from '../types';

interface OrderContextType {
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'trackingUpdates'>) => string;
  getOrder: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  rateOrder: (orderId: string, rating: number, comment: string) => void;
  simulateOrderProgress: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  'to-pay': 'Order placed — awaiting payment',
  'to-ship': 'Payment confirmed! Our florists are preparing your bouquet',
  'to-receive': 'Your bouquet is on its way!',
  'to-rate': 'Delivered successfully — enjoy your flowers!',
  'rated': 'Thank you for your feedback!',
  'cancelled': 'Order cancelled',
};

const STATUS_LOCATIONS: Record<OrderStatus, string> = {
  'to-pay': 'The Flower Shop',
  'to-ship': 'The Flower Shop — Arrangement Studio',
  'to-receive': 'In Transit',
  'to-rate': 'Delivery Address',
  'rated': 'Delivery Address',
  'cancelled': 'The Flower Shop',
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-DEMO-001',
    items: [],
    total: 89.99,
    status: 'to-pay',
    customerName: 'Jane Doe',
    deliveryAddress: '123 Rose Street, Bloom City',
    phone: '555-1234',
    email: 'jane@example.com',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
    paymentMethod: 'e-wallet',
    trackingUpdates: [
      { status: 'to-pay', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-pay'], location: STATUS_LOCATIONS['to-pay'] },
    ],
  },
  {
    id: 'ORD-DEMO-002',
    items: [],
    total: 149.98,
    paymentMethod: 'bank-transfer',
    status: 'to-ship',
    customerName: 'John Smith',
    deliveryAddress: '456 Petal Ave, Garden Town',
    phone: '555-5678',
    email: 'john@example.com',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000),
    trackingUpdates: [
      { status: 'to-pay', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-pay'], location: STATUS_LOCATIONS['to-pay'] },
      { status: 'to-ship', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-ship'], location: STATUS_LOCATIONS['to-ship'] },
      { status: 'to-receive', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-receive'], location: STATUS_LOCATIONS['to-receive'] },
    ],
  },
  {
    id: 'ORD-DEMO-003',
    items: [],
    total: 99.99,
    status: 'to-rate',
    customerName: 'Emily Chen',
    deliveryAddress: '789 Blossom Blvd, Flower District',
    phone: '555-9012',
    email: 'emily@example.com',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() - 12 * 60 * 60 * 1000),
    trackingUpdates: [
      { status: 'to-pay', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-pay'], location: STATUS_LOCATIONS['to-pay'] },
      { status: 'to-ship', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-ship'], location: STATUS_LOCATIONS['to-ship'] },
      { status: 'to-receive', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-receive'], location: STATUS_LOCATIONS['to-receive'] },
      { status: 'to-rate', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-rate'], location: STATUS_LOCATIONS['to-rate'] },
    ],
  },
  {
    id: 'ORD-DEMO-004',
    items: [],
    total: 119.99,
    status: 'rated',
    customerName: 'Maria Garcia',
    deliveryAddress: '321 Tulip Lane, Spring Valley',
    phone: '555-3456',
    email: 'maria@example.com',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    rating: 5,
    ratingComment: 'Absolutely beautiful arrangement!',
    trackingUpdates: [
      { status: 'to-pay', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-pay'], location: STATUS_LOCATIONS['to-pay'] },
      { status: 'to-ship', timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-ship'], location: STATUS_LOCATIONS['to-ship'] },
      { status: 'to-receive', timestamp: new Date(Date.now() - 3.2 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-receive'], location: STATUS_LOCATIONS['to-receive'] },
      { status: 'to-rate', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['to-rate'], location: STATUS_LOCATIONS['to-rate'] },
      { status: 'rated', timestamp: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000), message: STATUS_MESSAGES['rated'], location: STATUS_LOCATIONS['rated'] },
    ],
  },
];

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const createOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'trackingUpdates'>) => {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date();

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: 'to-pay',
      createdAt: now,
      trackingUpdates: [
        { status: 'to-pay', timestamp: now, message: STATUS_MESSAGES['to-pay'], location: STATUS_LOCATIONS['to-pay'] },
      ],
    };

    setOrders(prev => [...prev, newOrder]);
    setTimeout(() => simulateOrderProgress(orderId), 3000);
    return orderId;
  };

  const getOrder = (orderId: string) => orders.find(o => o.id === orderId);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status,
        trackingUpdates: [
          ...order.trackingUpdates,
          { status, timestamp: new Date(), message: STATUS_MESSAGES[status], location: STATUS_LOCATIONS[status] },
        ],
      };
    }));
  };

  const rateOrder = (orderId: string, rating: number, comment: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: 'rated',
        rating,
        ratingComment: comment,
        trackingUpdates: [
          ...order.trackingUpdates,
          { status: 'rated', timestamp: new Date(), message: STATUS_MESSAGES['rated'], location: STATUS_LOCATIONS['rated'] },
        ],
      };
    }));
  };

  const simulateOrderProgress = (orderId: string) => {
    const progression: OrderStatus[] = ['to-pay', 'to-ship', 'to-receive', 'to-rate'];

    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id !== orderId) return order;
        const currentIndex = progression.indexOf(order.status as any);
        if (currentIndex < 0 || currentIndex >= progression.length - 1) return order;

        const nextStatus = progression[currentIndex + 1];
        const updatedOrder = {
          ...order,
          status: nextStatus,
          trackingUpdates: [
            ...order.trackingUpdates,
            { status: nextStatus, timestamp: new Date(), message: STATUS_MESSAGES[nextStatus], location: STATUS_LOCATIONS[nextStatus] },
          ],
        };

        if (nextStatus !== 'to-rate') {
          setTimeout(() => simulateOrderProgress(orderId), Math.random() * 4000 + 3000);
        }

        return updatedOrder;
      });
    });
  };

  return (
    <OrderContext.Provider value={{ orders, createOrder, getOrder, updateOrderStatus, rateOrder, simulateOrderProgress }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
