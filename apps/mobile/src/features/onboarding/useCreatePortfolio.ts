import { useCallback } from 'react';

import {
    MnemonicResource,
    PortfolioFactory,
    PortfolioMeta,
    PortfolioNetworkType
} from '@safely/core';
import { useAddPortfolio, useAppSdk, useSetActivePortfolio } from '@safely/ux';

export function useCreatePortfolio() {
    const sdk = useAppSdk();
    const { mutateAsync: addPortfolio } = useAddPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    return useCallback(
        async (mnemonic: string[], meta: PortfolioMeta) => {
            const factory = new PortfolioFactory(sdk.secretEncryptor);
            using mnemonicResource = new MnemonicResource(mnemonic);

            const portfolio = await factory.generatePortfolio(mnemonicResource, {
                network: PortfolioNetworkType.MAINNET,
                name: meta.name
            });

            if (!portfolio) {
                throw new Error('Failed to create portfolio');
            }

            portfolio.updateMeta(meta);

            await addPortfolio(portfolio);
            await setActivePortfolio(portfolio);

            return portfolio;
        },
        [sdk.secretEncryptor, addPortfolio, setActivePortfolio]
    );
}
