import { useNavigation } from '@react-navigation/core';
import { t } from 'i18next';
import { useCallback } from 'react';

import type { BtcActivityItem } from '@safely/ux';
import { useActivePortfolio, useHasPortfolio } from '@safely/ux';

import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';

const HistoryContent = () => {
    const navigation = useNavigation();
    const portfolio = useActivePortfolio();

    const onNavigateToTransaction = useCallback(
        (activity: BtcActivityItem) => {
            navigation.navigate('TransactionScreen', { activity });
        },
        [navigation]
    );

    return (
        <>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title>{t('history.title')}</Screen.Header.Title>
            </Screen.Header>
            <HistoryList
                key={portfolio?.id.toString()}
                onNavigateToTransaction={onNavigateToTransaction}
            />
        </>
    );
};

export const HistoryScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return <Screen>{hasPortfolio && <HistoryContent />}</Screen>;
};
