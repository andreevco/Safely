import { createContext, useContext } from 'react';

export type BannerVariant = 'warn' | 'danger';

type BannerContextValue = {
    variant?: BannerVariant;
};

export const BannerContext = createContext<BannerContextValue>({});

export const useBannerContext = () => useContext(BannerContext);
