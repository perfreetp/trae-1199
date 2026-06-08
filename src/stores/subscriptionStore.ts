import { create } from 'zustand';
import type { Subscription, Notification } from '../types';
import { mockSubscriptions, mockNotifications } from '../data/mockData';

interface SubscriptionState {
  subscriptions: Subscription[];
  notifications: Notification[];
  unreadCount: number;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  removeSubscription: (subId: string) => void;
  toggleSubscription: (subId: string) => void;
  updateSubscription: (subId: string, updates: Partial<Subscription>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  loadUnreadCount: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: mockSubscriptions,
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.isRead).length,

  addSubscription: (sub) => {
    const newSub: Subscription = {
      ...sub,
      id: `s${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => ({
      subscriptions: [...state.subscriptions, newSub],
    }));
  },

  removeSubscription: (subId) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== subId),
    })),

  toggleSubscription: (subId) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subId ? { ...s, enabled: !s.enabled } : s
      ),
    })),

  updateSubscription: (subId, updates) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subId ? { ...s, ...updates } : s
      ),
    })),

  markAsRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      return { notifications, unreadCount: 0 };
    }),

  clearNotification: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== notificationId);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  loadUnreadCount: () => {
    const { notifications } = get();
    set({ unreadCount: notifications.filter((n) => !n.isRead).length });
  },
}));
