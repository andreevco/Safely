import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRequestNotificationPermission } from '@mobile/features/notifications';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { Button, Icon, Notifications96, Screen, Text } from '@mobile/shared/ui';

import { styles } from './NotificationsScreen.styles';

export const OnboardingNotificationsScreen = () => {
    const { t } = useTranslation();
    const { mutateAsync: requestPermission } = useRequestNotificationPermission();
    const { onNotificationsFinished } = useOnboardingFlow();

    const handleEnable = useCallback(async () => {
        await requestPermission();
        onNotificationsFinished();
    }, [requestPermission, onNotificationsFinished]);

    const handleSkip = useCallback(() => {
        onNotificationsFinished();
    }, [onNotificationsFinished]);

    return (
        <Screen>
            <Screen.Header>
                <View />
                <Screen.Header.Button type="small" onPress={handleSkip}>
                    <Text variant="labelM">{t('common.later')}</Text>
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Icon icon={Notifications96} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('onboarding.notifications.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('onboarding.notifications.description')}
                        </Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={handleEnable}>
                        {t('onboarding.notifications.enable')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
