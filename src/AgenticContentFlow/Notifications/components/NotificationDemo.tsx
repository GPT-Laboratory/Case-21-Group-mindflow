import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationDemo: React.FC = () => {
  const {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showBlockingNotification,
    updateBlockingNotification,
    completeBlockingNotification,
    failBlockingNotification
  } = useNotifications();

  const handleToastDemo = () => {
    showSuccessToast("Success!", "This is a success toast notification");
    
    setTimeout(() => {
      showErrorToast("Error occurred", "This is an error toast");
    }, 1000);
    
    setTimeout(() => {
      showWarningToast("Warning", "This is a warning toast");
    }, 2000);
    
    setTimeout(() => {
      showInfoToast("Information", "This is an info toast");
    }, 3000);
  };

  const handleBlockingDemo = () => {
    const id = showBlockingNotification("Processing data", "Starting operation...");
    
    setTimeout(() => {
      updateBlockingNotification(id, 'loading', 25);
    }, 500);
    
    setTimeout(() => {
      updateBlockingNotification(id, 'loading', 50);
    }, 1000);
    
    setTimeout(() => {
      updateBlockingNotification(id, 'loading', 75);
    }, 1500);
    
    setTimeout(() => {
      completeBlockingNotification(id, "Operation completed successfully!");
    }, 2000);
  };

  const handleBlockingError = () => {
    const id = showBlockingNotification("Processing critical operation", "This might fail...");
    
    setTimeout(() => {
      failBlockingNotification(id, "Operation failed due to network error");
    }, 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-medium mb-3">Notification System Demo</h3>
      <div className="flex flex-col gap-2">
        <Button onClick={handleToastDemo} variant="outline" size="sm">
          Show Toast Sequence
        </Button>
        <Button onClick={handleBlockingDemo} variant="outline" size="sm">
          Show Blocking Progress
        </Button>
        <Button onClick={handleBlockingError} variant="destructive" size="sm">
          Show Blocking Error
        </Button>
      </div>
    </div>
  );
};