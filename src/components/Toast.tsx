/**
 * Toast Component
 * 
 * Simple, discrete toast notification.
 */

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'info' | 'error' | 'success';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  show,
  onHide,
  duration = 3000,
  type = 'info',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onHide, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!show && !visible) return null;

  const bgColor = {
    info: 'bg-cleanup-card border-cleanup-border',
    error: 'bg-cleanup-error/10 border-cleanup-error/30',
    success: 'bg-cleanup-secondary/10 border-cleanup-secondary/30',
  }[type];

  const textColor = {
    info: 'text-white',
    error: 'text-cleanup-error',
    success: 'text-cleanup-secondary',
  }[type];

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-xl border backdrop-blur-xl
        text-sm ${textColor}
        transition-all duration-300
        ${bgColor}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {message}
    </div>
  );
};

export default Toast;
