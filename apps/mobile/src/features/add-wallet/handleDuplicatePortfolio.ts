import { CommonActions } from '@react-navigation/native';

import { PortfolioAlreadyExistsError } from '@safely/core';

interface INavigation {
    dispatch: (action: ReturnType<typeof CommonActions.navigate>) => void;
}

export function handleDuplicatePortfolio(error: unknown, navigation: INavigation): void {
    if (error instanceof PortfolioAlreadyExistsError && error.existingPortfolio) {
        navigation.dispatch(
            CommonActions.navigate('WalletAlreadyAddedModal', {
                portfolio: error.existingPortfolio
            })
        );

        return;
    }

    throw error;
}
