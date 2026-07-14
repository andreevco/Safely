import { useNavigation } from '@react-navigation/core';
import { useEffect } from 'react';

import { useHasPortfolio } from '@safely/ux';

import { WalletSettingsContent } from './WalletSettingsContent';

export const WalletSettingsScreen = () => {
    const navigation = useNavigation();
    const hasPortfolio = useHasPortfolio();

    useEffect(() => {
        if (!hasPortfolio) {
            navigation.goBack();
        }
    }, [hasPortfolio, navigation]);

    return hasPortfolio ? <WalletSettingsContent /> : null;
};
