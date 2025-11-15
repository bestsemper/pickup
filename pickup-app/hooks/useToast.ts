'use client';

import { useState, useCallback, useRef } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastToastTime = useRef<number>(0);
  const MIN_TOAST_INTERVAL = 500; // Minimum 500ms between toasts

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const now = Date.now();
    
    // Prevent spam: check if enough time has passed since last toast
    if (now - lastToastTime.current < MIN_TOAST_INTERVAL) {
      return;
    }
    
    // Check if identical toast already exists
    setToasts(prev => {
      const isDuplicate = prev.some(toast => toast.message === message && toast.type === type);
      if (isDuplicate) {
        return prev;
      }
      
      lastToastTime.current = now;
      const id = now;
      return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
