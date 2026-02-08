import { HistoryList } from '@mobile/features/history';
import { Screen } from '@mobile/shared/ui';
import { useTranslation } from 'react-i18next';

export const HistoryScreen = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title>{t('history.title')}</Screen.Header.Title>
            </Screen.Header>
            <Screen.Content>
                <HistoryList />
            </Screen.Content>
        </Screen>
    );
};
