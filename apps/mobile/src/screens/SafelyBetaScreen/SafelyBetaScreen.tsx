import { useTranslation } from 'react-i18next';

import { useAppContext } from '@safely/ux';

import { AboutFeed } from '@mobile/features/about';
import { Screen, Text } from '@mobile/shared/ui';

export const SafelyBetaScreen = () => {
    const { t } = useTranslation();
    const { version } = useAppContext();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title>
                    <Text variant="titleS">{t('safelyBeta.title')}</Text>
                    <Text variant="bodyM" color="secondary">
                        {t('safelyBeta.subtitle', { version })}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>
            <AboutFeed />
        </Screen>
    );
};
