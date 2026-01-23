import React from 'react';

export type HeaderVariant = 'center' | 'left';

export const HeaderVariantContext = React.createContext<{ variant: HeaderVariant }>({
    variant: 'center'
});

export const useHeaderVariant = () => React.useContext(HeaderVariantContext).variant;
