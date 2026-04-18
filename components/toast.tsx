'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-zinc-900 text-emerald-400',
  error:   'border-rose-500/40 bg-zinc-900 text-rose-400',
  info:    'border-zinc-600/40 bg-zinc-900 text-zinc-300',
};

const ICON_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-500/15 text-emerald-400',
  error:   'bg-rose-500/15 text-rose-400',
  info:    'bg-zinc-700/50 text-zinc-400',
};


export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, visible: true }]);

    // Start fade-out after 2.5s, remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
    }, 2500);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-24 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl
              text-sm font-medium max-w-sm w-full pointer-events-auto
              transition-all duration-500
              ${STYLES[t.type]}
              ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ICON_STYLES[t.type]}`}>
              {ICONS[t.type]}
            </span>
            <span className="text-zinc-100">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
