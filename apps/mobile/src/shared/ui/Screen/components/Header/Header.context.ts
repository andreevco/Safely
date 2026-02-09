import React from 'react';

export type HeaderVariant = 'center' | 'left';

type HeaderContextValue = {
    variant: HeaderVariant;
    hasSides: boolean;
    shouldInsetTop: boolean;
};

export const HeaderContext = React.createContext<HeaderContextValue>({
    variant: 'center',
    hasSides: false,
    shouldInsetTop: false
});

export const useHeaderVariant = () => React.useContext(HeaderContext).variant;
export const useHeaderHasSides = () => React.useContext(HeaderContext).hasSides;
export const useHeaderShouldInsetTop = () => React.useContext(HeaderContext).shouldInsetTop;
export const useHeaderContext = () => React.useContext(HeaderContext);
