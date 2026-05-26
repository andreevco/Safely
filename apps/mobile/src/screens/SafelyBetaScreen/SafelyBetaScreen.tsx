import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext, useBetaFeedWatched } from '@safely/ux';

import { AboutFeed } from '@mobile/features/about';
import { Screen, Text } from '@mobile/shared/ui';

import { styles } from './SafelyBetaScreen.styles';

export const SafelyBetaScreen = () => {
    const { t } = useTranslation();
    const { version } = useAppContext();
    const navigation = useNavigation();
    const { shouldShowBadge, markWatched } = useBetaFeedWatched();

    useEffect(() => {
        navigation.setOptions({
            tabBarBadge: shouldShowBadge ? '' : undefined,
            tabBarBadgeStyle: styles.badge
        });
    }, [shouldShowBadge, navigation]);

    useFocusEffect(
        useCallback(() => {
            void markWatched();
        }, [markWatched])
    );

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
