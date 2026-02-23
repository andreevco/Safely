import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ToastOptions, ToastService } from '@safely/ux';

import { Toast } from '../../shared';

type ToastState = {
    message: string;
    type?: 'success' | 'error';
};

type ToastProviderContextValue = {
    toastService: ToastService;
};

const ToastProviderContext = React.createContext<ToastProviderContextValue | null>(null);

export function useToastServiceContext() {
    const context = React.useContext(ToastProviderContext);
    if (!context) {
        throw new Error('useToastServiceContext must be used within ToastProvider');
    }

    return context.toastService;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHideTimeout = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            clearHideTimeout();
        };
    }, [clearHideTimeout]);

    const hide = useCallback(() => {
        setToast(null);
        clearHideTimeout();
    }, [clearHideTimeout]);

    const show = useCallback(
        (options: ToastOptions | string) => {
            const normalized: ToastOptions =
                typeof options === 'string' ? { message: options, type: 'success' } : options;

            clearHideTimeout();

            setToast({
                message: normalized.message,
                type: normalized.type ?? 'success'
            });

            const duration = normalized.duration ?? 2000;
            hideTimeoutRef.current = setTimeout(hide, duration);
        },
        [clearHideTimeout, hide]
    );

    const toastService = useMemo<ToastService>(() => {
        return {
            show(options) {
                show(options);
            }
        };
    }, [show]);

    return (
        <ToastProviderContext.Provider value={{ toastService }}>
            {children}
            {toast &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
                        <div className="pointer-events-auto">
                            <Toast message={toast.message} type={toast.type} onClose={hide} />
                        </div>
                    </div>,
                    document.body
                )}
        </ToastProviderContext.Provider>
    );
}
