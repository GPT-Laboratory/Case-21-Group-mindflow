import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationItem } from '../types';
import { Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react';

const getToastIcon = (status: NotificationItem['status']) => {
  switch (status) {
    case 'success':
      return <Check className="w-4 h-4" />;
    case 'error':
      return <X className="w-4 h-4" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;
    case 'loading':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'info':
    case 'pending':
    default:
      return <Info className="w-4 h-4" />;
  }
};

export const ToastNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifications } = useNotificationStore();

  useEffect(() => {
    // Find new toast notifications that haven't been shown yet
    const toastNotifications = notifications.filter(n => 
      n.type === 'toast' && 
      !n.metadata?.toastShown
    );

    toastNotifications.forEach((notification) => {
      // Mark as shown to prevent duplicate toasts
      useNotificationStore.getState().updateNotification(notification.id, {
        metadata: { ...notification.metadata, toastShown: true }
      });

      const toastContent = (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getToastIcon(notification.status)}
          </div>
          <div className="flex-grow">
            <div className="font-medium text-sm">
              {notification.title}
            </div>
            {notification.message && (
              <div className="text-xs opacity-80 mt-1">
                {notification.message}
              </div>
            )}
          </div>
        </div>
      );

      // Show toast based on status
      switch (notification.status) {
        case 'success':
          toast.success(toastContent, {
            id: notification.id,
            duration: notification.timeout || 4000,
          });
          break;
        case 'error':
          toast.error(toastContent, {
            id: notification.id,
            duration: notification.timeout || 6000,
          });
          break;
        case 'warning':
          toast.warning(toastContent, {
            id: notification.id,
            duration: notification.timeout || 5000,
          });
          break;
        case 'loading':
          toast.loading(toastContent, {
            id: notification.id,
            duration: Infinity, // Keep loading toasts until manually dismissed
          });
          break;
        case 'info':
        case 'pending':
        default:
          toast(toastContent, {
            id: notification.id,
            duration: notification.timeout || 4000,
          });
          break;
      }

      // Handle actions if provided
      if (notification.actions && notification.actions.length > 0) {
        // For now, we'll add the first action as a button
        // Sonner supports action buttons in newer versions
        const action = notification.actions[0];
        toast(toastContent, {
          id: notification.id,
          action: {
            label: action.label,
            onClick: action.onClick,
          },
          duration: notification.timeout || 6000,
        });
      }
    });
  }, [notifications]);


  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        toastOptions={{
          style: {
            borderRadius: '8px',
            padding: '16px',
          },
          className: 'text-sm',
        }}
      />
    </>
  );
};