import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { BtcActivityItem, useHasHistory, useHasPortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { HistoryList } from '@mobile/features/history';
import { WalletSelector } from '@mobile/features/portfolio';
import { Screen } from '@mobile/shared/ui';

const HistoryContent = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const { data: hasHistory } = useHasHistory();

    const onNavigateToTransaction = useCallback(
        (activity: BtcActivityItem) => {
            navigation.navigate('TransactionScreen', { activity });
        },
        [navigation]
    );

    return (
        <>
            {hasHistory !== false && (
                <Screen.Header>
                    <Screen.Header.Title>
                        <WalletSelector />
                    </Screen.Header.Title>
                </Screen.Header>
            )}
            <HistoryList onNavigateToTransaction={onNavigateToTransaction} />
        </>
    );
};

export const HistoryScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return <Screen>{hasPortfolio && <HistoryContent />}</Screen>;
};
