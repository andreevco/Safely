import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useState } from 'react';

import type { ToastService } from '@safely/ux';

export const ToastServiceContext = createContext<
    { service: ToastService; setService: (service: ToastService) => void } | undefined
>(undefined);

export const useToastServiceContext = () => {
    const context = useContext(ToastServiceContext);

    if (!context) {
        throw new Error('ToastProvider must be used within ToastServiceContext');
    }

    return context;
};

export const ToastServiceProvider: FC<PropsWithChildren> = ({ children }) => {
    const [service, setService] = useState<ToastService>({
        show() {
            /* empty */
        }
    });
    return <ToastServiceContext value={{ service, setService }}>{children}</ToastServiceContext>;
};
