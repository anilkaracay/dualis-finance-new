'use client';

import { create } from 'zustand';
import type { NotificationType } from '@dualis/shared';
import { notificationTypeToDisplayType } from '@dualis/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationDisplayType = 'warning' | 'critical' | 'success' | 'governance' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationDisplayType;
  backendType?: NotificationType;
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  data?: Record<string, unknown>;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
}

interface NotificationActions {
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read'>) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  appendNotifications: (notifications: NotificationItem[]) => void;
  /** Map a backend stored notification to a frontend NotificationItem */
  addFromBackend: (stored: BackendNotification) => void;
}

/** Shape of a notification received from the backend API / WebSocket */
export interface BackendNotification {
  id: string;
  type: NotificationType;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  status: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

function mapBackendToItem(n: BackendNotification): NotificationItem {
  const item: NotificationItem = {
    id: n.id,
    type: notificationTypeToDisplayType(n.type),
    backendType: n.type,
    severity: n.severity,
    title: n.title,
    description: n.message,
    timestamp: n.createdAt,
    read: n.status === 'read' || !!n.readAt,
  };
  if (n.link) item.link = n.link;
  if (n.data) item.data = n.data;
  return item;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNotificationStore = create<NotificationState & NotificationActions>()((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  page: 1,

  addNotification: (notification) =>
    set((state) => {
      const newNotif: NotificationItem = {
        ...notification,
        id: `notif-${Date.now()}`,
        read: false,
      };
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),

  addFromBackend: (stored) =>
    set((state) => {
      // Avoid duplicates
      if (state.notifications.some((n) => n.id === stored.id)) return state;
      const item = mapBackendToItem(stored);
      return {
        notifications: [item, ...state.notifications],
        unreadCount: item.read ? state.unreadCount : state.unreadCount + 1,
      };
    }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  appendNotifications: (notifications) =>
    set((state) => ({
      notifications: [...state.notifications, ...notifications],
    })),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  setLoading: (loading) => set({ loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
}));

export { mapBackendToItem };
