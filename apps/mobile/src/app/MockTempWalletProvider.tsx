import { FC, PropsWithChildren } from 'react';

import { useGeneratePortfolio, useHasPortfolio } from '@safely/ux';

export const MockTempWalletProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasPortfolio = useHasPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();

    if (!hasPortfolio) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw generatePortfolio();
    }

    return children;
};
