import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActiveAccountQuery, useAppContext, useConnectAccountToNewDevice } from '@safely/ux';

import { useOnboardingFlow } from '@mobile/features/onboarding';
import { TEST_ID } from '@mobile/shared/constants';
import { Button, Checkmark96, Icon, Screen, StepsList, Text } from '@mobile/shared/ui';

import { styles } from './AccountCreatedScreen.styles';

const stepKeys = [
    'onboarding.accountCreated.steps.step1',
    'onboarding.accountCreated.steps.step2',
    'onboarding.accountCreated.steps.step3'
] as const;

export const AccountCreatedScreen = () => {
    const { t } = useTranslation();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();
    const { onAccountCreatedFinished } = useOnboardingFlow();
    const { mutateAsync: connectAccountToNewDevice } = useConnectAccountToNewDevice();

    const steps = stepKeys.map(key => ({ title: t(key) }));

    const handleAddDevice = useCallback(async () => {
        if (!activeAccount) return;

        using secureEncryptedStorage = getSecureEncrypted();

        // don't ask for the password while setting app initially after first account creation during onboarding to provide smooth user experience
        secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

        await connectAccountToNewDevice({ secureEncryptedStorage });
        onAccountCreatedFinished();
    }, [connectAccountToNewDevice, activeAccount, getSecureEncrypted, onAccountCreatedFinished]);

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
                    <View style={styles.stepsWrapper}>
                        <StepsList steps={steps} />
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button
                        testID={TEST_ID.accountCreated.addDevice}
                        type="primary"
                        size="large"
                        onPress={handleAddDevice}
                    >
                        {t('onboarding.accountCreated.addDevice')}
                    </Button>
                    <Button
                        testID={TEST_ID.accountCreated.protectLater}
                        type="secondary"
                        size="large"
                        onPress={handleProtectLater}
                    >
                        {t('onboarding.accountCreated.protectLater')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
