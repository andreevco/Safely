import { useCallback } from 'react';

import type { ToastOptions } from './types';
import { useAppContext } from '../../shared';

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
