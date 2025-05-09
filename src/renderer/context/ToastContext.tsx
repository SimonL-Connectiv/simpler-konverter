/*
* Soll toasts Unten links rendernun düber eine funktion soll es möglich sein neue zu starten und der drückt dann die bestehenden nach oben, jeder toast ist beim erscheinen und verschwinden animiert und
* es soll warn, error und success geben mit einer standart dauer von 4000ms und diese toasts sind stand jetzt nirdgens eingeplant, aber dir fällt sicherlich eien sinnvolle verwendung dafür ein.
* */

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

type ToastType = 'warn' | 'error' | 'success';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast: ToastContextValue['addToast'] = useCallback((type, message, duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(({ id, type, message }) => (
          <div
            key={id}
            className={`pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
              type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-yellow-600'
            }`}
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast muss innerhalb von ToastProvider verwendet werden');
  }
  return ctx;
}
