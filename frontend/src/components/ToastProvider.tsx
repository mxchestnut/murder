import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  showError: (error: any, fallbackMessage?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const showError = useCallback((error: any, fallbackMessage = 'An error occurred') => {
    // Log to Sentry
    Sentry.captureException(error);

    // Convert technical error to user-friendly message
    let userMessage = fallbackMessage;

    if (error?.response?.data?.error) {
      userMessage = error.response.data.error;
    } else if (error?.message) {
      // Map common technical errors to user-friendly messages
      if (error.message.includes('Network Error')) {
        userMessage = '❌ Cannot connect to server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        userMessage = '⏱️ Request timed out. Please try again.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        userMessage = '🔒 You need to log in to do that.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        userMessage = '🚫 You don\'t have permission to do that.';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        userMessage = '🔍 The requested resource was not found.';
      } else if (error.message.includes('500')) {
        userMessage = '⚠️ Server error. Our team has been notified.';
      } else {
        userMessage = error.message;
      }
    }

    showToast('error', userMessage, 7000);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showError, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  const containerStyle = {
    position: 'fixed' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    maxWidth: '400px',
  };

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
  };

  const color = colors[toast.type];

  const toastStyle = {
    backgroundColor: color.bg,
    border: `1px solid ${color.border}`,
    color: color.text,
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    animation: 'slideIn 0.3s ease-out',
    minWidth: '300px',
  };

  const messageStyle = {
    flex: 1,
    fontSize: '0.875rem',
    lineHeight: '1.5',
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: color.text,
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  };

  return (
    <>
      <div style={toastStyle}>
        <div style={messageStyle}>{toast.message}</div>
        <button
          style={closeButtonStyle}
          onClick={() => onRemove(toast.id)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
