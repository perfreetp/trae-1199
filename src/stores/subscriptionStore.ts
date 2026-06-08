import { create } from 'zustand';
import type { Subscription, Notification } from '../types';
import { mockSubscriptions, mockNotifications } from '../data/mockData';
import { loadPersist, savePersist } from './persist';

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

const storedSubscriptions = loadPersist<Subscription[]>('subscriptions', mockSubscriptions);
const storedNotifications = loadPersist<Notification[]>('notifications', mockNotifications);

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: storedSubscriptions,
  notifications: storedNotifications,
  unreadCount: storedNotifications.filter((n) => !n.isRead).length,

  addSubscription: (sub) => {
    const newSub: Subscription = {
      ...sub,
      id: `s${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => {
      const newSubscriptions = [...state.subscriptions, newSub];
      savePersist('subscriptions', newSubscriptions);
      return { subscriptions: newSubscriptions };
    });
  },

  removeSubscription: (subId) =>
    set((state) => {
      const newSubscriptions = state.subscriptions.filter((s) => s.id !== subId);
      savePersist('subscriptions', newSubscriptions);
      return { subscriptions: newSubscriptions };
    }),

  toggleSubscription: (subId) =>
    set((state) => {
      const newSubscriptions = state.subscriptions.map((s) =>
        s.id === subId ? { ...s, enabled: !s.enabled } : s
      );
      savePersist('subscriptions', newSubscriptions);
      return { subscriptions: newSubscriptions };
    }),

  updateSubscription: (subId, updates) =>
    set((state) => {
      const newSubscriptions = state.subscriptions.map((s) =>
        s.id === subId ? { ...s, ...updates } : s
      );
      savePersist('subscriptions', newSubscriptions);
      return { subscriptions: newSubscriptions };
    }),

  markAsRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      savePersist('notifications', notifications);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      savePersist('notifications', notifications);
      return { notifications, unreadCount: 0 };
    }),

  clearNotification: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== notificationId);
      savePersist('notifications', notifications);
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
