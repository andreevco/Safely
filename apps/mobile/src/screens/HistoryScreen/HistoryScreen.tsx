import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { BtcActivityItem, useHasHistory } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';

export const HistoryScreen = () => {
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
        <Screen>
            {hasHistory !== false && (
                <Screen.Header>
                    <Screen.Header.Title>{t('history.title')}</Screen.Header.Title>
                </Screen.Header>
            )}
            <HistoryList onNavigateToTransaction={onNavigateToTransaction} />
        </Screen>
    );
};
