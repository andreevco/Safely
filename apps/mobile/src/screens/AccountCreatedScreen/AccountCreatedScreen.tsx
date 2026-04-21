import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActiveAccountQuery, useAppContext, useConnectAccountToNewDevice } from '@safely/ux';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { Button, Icon, Checkmark96, Screen, Text } from '@mobile/shared/ui';

import { styles } from './AccountCreatedScreen.styles';

const steps = [
    'onboarding.accountCreated.steps.step1',
    'onboarding.accountCreated.steps.step2',
    'onboarding.accountCreated.steps.step3'
] as const;

export const AccountCreatedScreen = () => {
    const { t } = useTranslation();
    const { getSecureEncryptedStorage } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();
    const { onAccountCreatedFinished } = useOnboardingFlow();
    const { mutateAsync: connectAccountToNewDevice } = useConnectAccountToNewDevice();

    const handleAddDevice = useCallback(async () => {
        if (!activeAccount) return;

        using secureEncryptedStorage = getSecureEncryptedStorage();
        secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

        await connectAccountToNewDevice({ secureEncryptedStorage });
        onAccountCreatedFinished();
    }, [
        connectAccountToNewDevice,
        activeAccount,
        getSecureEncryptedStorage,
        onAccountCreatedFinished
    ]);

    const handleProtectLater = useCallback(() => {
        onAccountCreatedFinished();
    }, [onAccountCreatedFinished]);

    return (
        <Screen>
            <Screen.Content>
                <View style={styles.content}>
                    <Icon icon={Checkmark96} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('onboarding.accountCreated.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('onboarding.accountCreated.subtitle')}
                        </Text>
                    </View>
                    <View style={styles.stepsContainerWrapper}>
                        <View style={styles.stepsContainer}>
                            {steps.map((step, index) => (
                                <View key={step} style={styles.stepRow}>
                                    <View style={styles.stepNumber}>
                                        <Text variant="bodyM" monospace color="tertiary">
                                            {index + 1}.
                                        </Text>
                                    </View>
                                    <View style={styles.stepText}>
                                        <Text variant="bodyM" color="primary">
                                            {t(step)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={handleAddDevice}>
                        {t('onboarding.accountCreated.addDevice')}
                    </Button>
                    <Button type="secondary" size="large" onPress={handleProtectLater}>
                        {t('onboarding.accountCreated.protectLater')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
