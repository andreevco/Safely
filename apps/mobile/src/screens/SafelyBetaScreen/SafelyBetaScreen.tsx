import { useNavigation } from '@react-navigation/core';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext, useBetaFeedWatched } from '@safely/ux';

import { AboutFeed } from '@mobile/features/about';
import { Screen, Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './SafelyBetaScreen.styles';

export const SafelyBetaScreen = () => {
    const { t } = useTranslation();
    const { version } = useAppContext();
    const navigation = useNavigation();
    const { shouldShowBadge, markWatched } = useBetaFeedWatched();
    const handleCopy = useCopy();

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
                    <Text
                        onPress={() => handleCopy(version, t('safelyBeta.versionCopied'))}
                        variant="bodyM"
                        color="secondary"
                    >
                        {version}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>
            <AboutFeed />
        </Screen>
    );
};
