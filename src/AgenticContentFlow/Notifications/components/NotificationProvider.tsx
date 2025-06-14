import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { BlockingNotificationOverlay } from './BlockingNotificationOverlay';
import { ToastNotificationProvider } from './ToastNotificationProvider';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { blockingNotifications, removeNotification } = useNotifications();

  return (
    <ToastNotificationProvider>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
        
        {/* Blocking notification overlay */}
        <BlockingNotificationOverlay
          notifications={blockingNotifications}
          onDismiss={removeNotification}
        />
      </div>
    </ToastNotificationProvider>
  );
};