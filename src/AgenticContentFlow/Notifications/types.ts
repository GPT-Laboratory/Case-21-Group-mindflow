export type NotificationStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning' | 'info';

export type NotificationType = 'blocking' | 'toast';

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  status: NotificationStatus;
  type: NotificationType;
  /** For blocking notifications - whether this blocks the UI */
  blocking: boolean;
  /** Timestamp when created */
  createdAt: number;
  /** Optional timeout for auto-removal (in ms) */
  timeout?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Progress percentage (0-100) for loading states */
  progress?: number;
  /** Action buttons for interactive notifications */
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

export interface NotificationStore {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => string;
  updateNotification: (id: string, updates: Partial<NotificationItem>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: (type?: NotificationType) => void;
  getBlockingNotifications: () => NotificationItem[];
  hasBlockingNotifications: () => boolean;
}

export interface NotificationConfig {
  /** Default timeout for toast notifications (ms) */
  defaultToastTimeout: number;
  /** Maximum number of toast notifications to show */
  maxToastNotifications: number;
  /** Whether to auto-remove successful notifications */
  autoRemoveSuccess: boolean;
  /** Timeout for auto-removing success notifications */
  successTimeout: number;
}