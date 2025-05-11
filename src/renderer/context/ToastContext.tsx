import {
    createContext,
    useCallback,
    useContext,
    useState,
    ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

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

    const addToast: ToastContextValue['addToast'] = useCallback(
        (type, message, duration = 4000) => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, type, message, duration }]);
            setTimeout(() => removeToast(id), duration);
        },
        [removeToast],
    );

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="shrink-0" size={20} />;
            case 'error':
                return <AlertCircle className="shrink-0" size={20} />;
            case 'warn':
                return <AlertTriangle className="shrink-0" size={20} />;
        }
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none max-w-md">
                <AnimatePresence>
                    {toasts.map(({ id, type, message }) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white flex items-start gap-2 ${
                                type === 'success'
                                    ? 'bg-green-600'
                                    : type === 'error'
                                      ? 'bg-red-600'
                                      : 'bg-yellow-600'
                            }`}
                        >
                            {getToastIcon(type)}
                            <div className="flex-1 text-sm">{message}</div>
                            <button
                                onClick={() => removeToast(id)}
                                className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error(
            'useToast muss innerhalb von ToastProvider verwendet werden',
        );
    }
    return ctx;
}
