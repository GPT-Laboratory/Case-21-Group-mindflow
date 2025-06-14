import { create } from 'zustand';
import { 
  NotificationItem, 
  NotificationStore, 
  NotificationConfig
} from '../types';

const DEFAULT_CONFIG: NotificationConfig = {
  defaultToastTimeout: 5000,
  maxToastNotifications: 5,
  autoRemoveSuccess: true,
  successTimeout: 3000,
};

export const useNotificationStore = create<NotificationStore & { config: NotificationConfig }>((set, get) => ({
  notifications: [],
  config: DEFAULT_CONFIG,

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationItem = {
      ...notification,
      id,
      createdAt: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove toast notifications after timeout
    if (notification.type === 'toast' && notification.timeout !== 0) {
      const timeout = notification.timeout || get().config.defaultToastTimeout;
      setTimeout(() => {
        get().removeNotification(id);
      }, timeout);
    }

    // Auto-remove successful notifications if enabled
    if (notification.status === 'success' && get().config.autoRemoveSuccess) {
      setTimeout(() => {
        get().removeNotification(id);
      }, get().config.successTimeout);
    }

    return id;
  },

  updateNotification: (id, updates) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      )
    }));

    // If updating to success and auto-remove is enabled, schedule removal
    if (updates.status === 'success' && get().config.autoRemoveSuccess) {
      setTimeout(() => {
        get().removeNotification(id);
      }, get().config.successTimeout);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== id)
    }));
  },

  clearNotifications: (type) => {
    set((state) => ({
      notifications: type 
        ? state.notifications.filter(notification => notification.type !== type)
        : []
    }));
  },

  getBlockingNotifications: () => {
    return get().notifications.filter(notification => 
      notification.type === 'blocking' && notification.blocking
    );
  },

  hasBlockingNotifications: () => {
    return get().getBlockingNotifications().length > 0;
  },
}));