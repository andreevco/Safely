import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { BtcActivityItem, useHasHistory, useHasPortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';

const HistoryContent = () => {
    const { t } = useTranslation();
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
                    <Screen.Header.Title>{t('history.title')}</Screen.Header.Title>
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
