import { useCallback } from 'react';

import { useAppContext } from '../providers';

export interface ToastOptions {
    message: string;
    type?: 'success' | 'error';
    duration?: number;
}

export interface ToastService {
    show(this: void, options: ToastOptions): void;
}

export function useToast() {
    const { toast } = useAppContext();

    return useCallback(
        (options: ToastOptions | string) => {
            if (typeof options === 'string') {
                toast.show({ message: options, type: 'success' });
            } else {
                toast.show(options);
            }
        },
        [toast]
    );
}
