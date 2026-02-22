'use client';

import { create } from 'zustand';

interface NotificationItem {
  id: string;
  type: 'warning' | 'success' | 'governance' | 'info';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
}

interface NotificationActions {
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'warning',
    title: 'Health Factor Alert',
    description: 'Your USDC borrow position health factor dropped to 1.67. Consider adding collateral.',
    timestamp: '2 hours ago',
    read: false,
    link: '/borrow',
  },
  {
    id: 'notif-2',
    type: 'success',
    title: 'Deposit Confirmed',
    description: 'Successfully deposited 500,000 USDC into the lending pool.',
    timestamp: '5 hours ago',
    read: false,
    link: '/portfolio',
  },
  {
    id: 'notif-3',
    type: 'governance',
    title: 'New Proposal: DIP-013',
    description: 'Vote on "Add wETH as collateral asset" — voting ends in 4 days.',
    timestamp: '1 day ago',
    read: true,
    link: '/governance',
  },
];

export const useNotificationStore = create<NotificationState & NotificationActions>()((set) => ({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,

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

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
