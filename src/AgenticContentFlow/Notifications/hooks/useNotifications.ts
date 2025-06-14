import { useCallback } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationItem } from '../types';

export interface UseNotificationsReturn {
  // Blocking notifications
  showBlockingNotification: (title: string, message?: string, progress?: number) => string;
  updateBlockingNotification: (id: string, status: NotificationItem['status'], progress?: number) => void;
  completeBlockingNotification: (id: string, message?: string) => void;
  failBlockingNotification: (id: string, error: string) => void;
  
  // Toast notifications
  showToast: (title: string, message?: string, status?: NotificationItem['status']) => string;
  showSuccessToast: (title: string, message?: string) => string;
  showErrorToast: (title: string, message?: string) => string;
  showWarningToast: (title: string, message?: string) => string;
  showInfoToast: (title: string, message?: string) => string;
  
  // General management
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  clearToasts: () => void;
  
  // Getters
  hasBlockingNotifications: boolean;
  blockingNotifications: NotificationItem[];
  toastNotifications: NotificationItem[];
}

export const useNotifications = (): UseNotificationsReturn => {
  const {
    addNotification,
    updateNotification,
    removeNotification,
    clearNotifications,
    getBlockingNotifications,
    hasBlockingNotifications,
    notifications
  } = useNotificationStore();

  // Blocking notification helpers
  const showBlockingNotification = useCallback((title: string, message?: string, progress?: number) => {
    return addNotification({
      title,
      message,
      status: 'loading',
      type: 'blocking',
      blocking: true,
      progress
    });
  }, [addNotification]);

  const updateBlockingNotification = useCallback((id: string, status: NotificationItem['status'], progress?: number) => {
    updateNotification(id, { status, progress });
  }, [updateNotification]);

  const completeBlockingNotification = useCallback((id: string, message?: string) => {
    updateNotification(id, { 
      status: 'success', 
      message: message || 'Completed successfully',
      progress: 100,
      blocking: false 
    });
  }, [updateNotification]);

  const failBlockingNotification = useCallback((id: string, error: string) => {
    updateNotification(id, { 
      status: 'error', 
      message: error,
      blocking: false 
    });
  }, [updateNotification]);

  // Toast notification helpers
  const showToast = useCallback((title: string, message?: string, status: NotificationItem['status'] = 'info') => {
    return addNotification({
      title,
      message,
      status,
      type: 'toast',
      blocking: false
    });
  }, [addNotification]);

  const showSuccessToast = useCallback((title: string, message?: string) => {
    return showToast(title, message, 'success');
  }, [showToast]);

  const showErrorToast = useCallback((title: string, message?: string) => {
    return showToast(title, message, 'error');
  }, [showToast]);

  const showWarningToast = useCallback((title: string, message?: string) => {
    return showToast(title, message, 'warning');
  }, [showToast]);

  const showInfoToast = useCallback((title: string, message?: string) => {
    return showToast(title, message, 'info');
  }, [showToast]);

  // Management helpers
  const clearAllNotifications = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  const clearToasts = useCallback(() => {
    clearNotifications('toast');
  }, [clearNotifications]);

  // Computed values
  const blockingNotifications = getBlockingNotifications();
  const toastNotifications = notifications.filter(n => n.type === 'toast');

  return {
    // Blocking notifications
    showBlockingNotification,
    updateBlockingNotification,
    completeBlockingNotification,
    failBlockingNotification,
    
    // Toast notifications
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    
    // Management
    removeNotification,
    clearAllNotifications,
    clearToasts,
    
    // Getters
    hasBlockingNotifications: hasBlockingNotifications(),
    blockingNotifications,
    toastNotifications
  };
};