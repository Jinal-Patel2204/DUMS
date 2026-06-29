'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  severity: ToastSeverity;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info', title?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, severity, title, message, duration: duration ?? 4000 }]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const showError = useCallback((message: string, title?: string) => showToast(message, 'error', title, 6000), [showToast]);
  const showWarning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
  const showInfo = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: index * 8 }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}
