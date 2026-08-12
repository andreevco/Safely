import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';

import type { PortfolioMeta } from '@safely/core';
import {
    PortfolioAlreadyExistsError,
    PortfolioNetworkType,
    PortfolioWatchOnlyBtc,
    toPortfolioIdWatchOnly
} from '@safely/core';
import { useAddWatchOnlyPortfolio, useNewPortfolioFallbackName, usePortfolios } from '@safely/ux';

import { WatchOnlyAddressForm } from '@mobile/features/add-wallet';
import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';

export const AddWatchOnlyScreen = () => {
    const navigation = useNavigation();
    const portfolios = usePortfolios();
    const { mutateAsync: addWatchOnlyPortfolio } = useAddWatchOnlyPortfolio();
    const defaultPortfolioName = useNewPortfolioFallbackName();

    const handleSubmit = useCallback(
        (input: string) => {
            const portfolioId = toPortfolioIdWatchOnly(
                PortfolioWatchOnlyBtc.resolveUserInput(input, PortfolioNetworkType.MAINNET)
            );

            const existingPortfolio = portfolios.find(p => p.id.isEq(portfolioId));
            if (existingPortfolio) {
                handleDuplicatePortfolio(
                    new PortfolioAlreadyExistsError(existingPortfolio),
                    navigation
                );

                return;
            }

            navigation.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                defaultName: defaultPortfolioName,
                defaultIcon: portfolioId.getFallbackEmoji(),
                onSave: async (meta: PortfolioMeta) => {
                    try {
                        await addWatchOnlyPortfolio({
                            input,
                            meta
                        });

                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    } catch (error) {
                        handleDuplicatePortfolio(error, navigation);
                    }
                }
            });
        },
        [portfolios, navigation, addWatchOnlyPortfolio, defaultPortfolioName]
    );

    return <WatchOnlyAddressForm onSubmit={handleSubmit} />;
};
