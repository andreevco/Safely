import React from 'react';

export type HeaderVariant = 'center' | 'left';

type HeaderContextValue = {
    variant: HeaderVariant;
    hasSides: boolean;
};

export const HeaderVariantContext = React.createContext<HeaderContextValue>({
    variant: 'center',
    hasSides: false
});

export const useHeaderVariant = () => React.useContext(HeaderVariantContext).variant;
export const useHeaderHasSides = () => React.useContext(HeaderVariantContext).hasSides;
