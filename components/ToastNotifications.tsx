import React from 'react';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface ToastNotificationsProps {
  toasts: Toast[];
}

const toastStyles = {
  success: 'bg-green-500 border-green-400',
  info: 'bg-blue-500 border-blue-400',
  warning: 'bg-yellow-500 border-yellow-400',
  error: 'bg-red-500 border-red-400',
};

const toastIcons = {
  success: '✓',
  info: 'ⓘ',
  warning: '⚠',
  error: '✕',
};

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center px-4 py-3 rounded-lg border shadow-lg text-white animate-slide-in-right ${
            toastStyles[toast.type]
          }`}
          style={{
            minWidth: '300px',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex-shrink-0 mr-3">
            <span className="text-lg font-bold">{toastIcons[toast.type]}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
