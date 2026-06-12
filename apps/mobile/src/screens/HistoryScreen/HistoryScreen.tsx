import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { RampOrder } from '@safely/core';
import type { BtcActivityItem } from '@safely/ux';
import { useActivePortfolio, useHasPortfolio } from '@safely/ux';

import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';

const HistoryContent = () => {
    const navigation = useNavigation();
    const portfolio = useActivePortfolio();
    const { t } = useTranslation();

    const onNavigateToTransaction = useCallback(
        (activity: BtcActivityItem) => {
            navigation.navigate('TransactionScreen', { activity });
        },
        [navigation]
    );

    const onNavigateToOrder = useCallback(
        (order: RampOrder) => {
            navigation.navigate('OrderScreen', { order });
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
                onNavigateToOrder={onNavigateToOrder}
            />
        </>
    );
};

export const HistoryScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return <Screen>{hasPortfolio && <HistoryContent />}</Screen>;
};
