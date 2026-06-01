import { createContext, useContext } from 'react';

export type BannerVariant = 'warn' | 'alternate' | 'danger';

type BannerContextValue = {
    variant?: BannerVariant;
};

export const BannerContext = createContext<BannerContextValue>({});

export const useBannerContext = () => useContext(BannerContext);
