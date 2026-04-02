import { createContext, FC, PropsWithChildren, useContext, useState } from 'react';

import { LoaderService, noopLoaderService } from '@safely/ux';

export const LoaderServiceContext = createContext<
    { service: LoaderService; setService: (service: LoaderService) => void } | undefined
>(undefined);

export const useLoaderServiceContext = () => {
    const context = useContext(LoaderServiceContext);

    if (!context) {
        throw new Error('useLoaderServiceContext must be used within LoaderServiceProvider');
    }

    return context;
};

export const LoaderServiceProvider: FC<PropsWithChildren> = ({ children }) => {
    const [service, setService] = useState<LoaderService>(noopLoaderService);
    return <LoaderServiceContext value={{ service, setService }}>{children}</LoaderServiceContext>;
};
