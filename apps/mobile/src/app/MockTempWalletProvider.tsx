import { FC, PropsWithChildren } from 'react';

import { useGeneratePortfolio, useHasPortfolio } from '@safely/ux';

export const MockTempWalletProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasPortfolio = useHasPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();

    if (!hasPortfolio) {
        throw generatePortfolio();
    }

    return children;
};
