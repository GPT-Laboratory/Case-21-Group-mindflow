import React from 'react';
import { Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface BlockingNotificationOverlayProps {
  notifications: NotificationItem[];
  onDismiss?: (id: string) => void;
}

const getStatusIcon = (status: NotificationItem['status']) => {
  switch (status) {
    case 'loading':
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    case 'success':
      return <Check className="w-5 h-5 text-green-500" />;
    case 'error':
      return <X className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
    case 'pending':
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Loader2 className="w-5 h-5 animate-spin text-gray-500" />;
  }
};

const getStatusColor = (status: NotificationItem['status']) => {
  switch (status) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'loading':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

export const BlockingNotificationOverlay: React.FC<BlockingNotificationOverlayProps> = ({
  notifications,
  onDismiss
}) => {
  if (notifications.length === 0) return null;

  const hasActiveBlocking = notifications.some(n => n.blocking);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        pointerEvents: hasActiveBlocking ? 'all' : 'none' // Allow interactions if no active blocking
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '70vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            System Initialization
          </div>
          <div style={{
            fontSize: '14px',
            color: '#64748b'
          }}>
            Please wait while we prepare your workspace
          </div>
        </div>

        {/* Notification List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${getStatusColor(notification.status)}`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(notification.status)}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="font-medium text-sm text-gray-900">
                  {notification.title}
                </div>
                {notification.message && (
                  <div className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </div>
                )}
                
                {/* Progress bar for loading notifications */}
                {notification.status === 'loading' && notification.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${notification.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {notification.progress}%
                    </div>
                  </div>
                )}
              </div>

              {/* Dismiss button for completed notifications */}
              {!notification.blocking && onDismiss && (
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                  style={{ opacity: 0.7 }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {notifications.filter(n => n.status === 'success').length} of {notifications.length} completed
          </div>
        </div>
      </div>
    </div>
  );
};