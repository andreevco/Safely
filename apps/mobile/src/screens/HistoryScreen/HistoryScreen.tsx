import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { assertUnreachable } from '@safely/core';
import type { ActivityItem } from '@safely/ux';
import { useActivePortfolio, useHasPortfolio } from '@safely/ux';

import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';

const HistoryContent = () => {
    const navigation = useNavigation();
    const portfolio = useActivePortfolio();
    const { t } = useTranslation();

    const onNavigateToActivityItem = useCallback(
        (activity: ActivityItem) => {
            switch (activity.type) {
                case 'order':
                    navigation.navigate('OrderScreen', { order: activity });
                    break;
                case 'transaction':
                    navigation.navigate('TransactionScreen', { activity });
                    break;
                default:
                    assertUnreachable(activity);
            }
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
                onNavigateToActivityItem={onNavigateToActivityItem}
            />
        </>
    );
};

export const HistoryScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return <Screen>{hasPortfolio && <HistoryContent />}</Screen>;
};
