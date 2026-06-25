import { useNavigation } from '@react-navigation/core';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    useAppContext,
    useConnectAccountToNewDevice,
    useSyncOnboardingCompletedQuery
} from '@safely/ux';

import { Button, DeviceLinkExclamationmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { SyncOnboarding } from './components/SyncOnboarding';
import { styles } from './SafetyScreen.styles';
import { shouldShowSyncOnboarding } from './shouldShowSyncOnboarding';

const steps = [
    'onboarding.accountCreated.steps.step1',
    'onboarding.accountCreated.steps.step2',
    'onboarding.accountCreated.steps.step3'
] as const;

export const SafetyScreen = () => {
    const { t } = useTranslation();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { mutateAsync: connectToNewDevice } = useConnectAccountToNewDevice();
    const navigation = useNavigation();

    const { data: completed } = useSyncOnboardingCompletedQuery();
    const isFocused = useIsFocused();
    const [forceOpen, setForceOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useFocusEffect(useCallback(() => () => setDismissed(false), []));

    const overlayVisible = shouldShowSyncOnboarding({
        forceOpen,
        isFocused,
        completed,
        dismissed
    });

    const handleOnboardingClose = useCallback(() => {
        setForceOpen(false);
        setDismissed(true);
    }, []);

    const handleOnboardingFinish = useCallback(() => {
        setForceOpen(false);
    }, []);

    const handleConnect = useCallback(async () => {
        using secureEncryptedStorage = getSecureEncrypted();
        await secureEncryptedStorage.unlock();

        await connectToNewDevice({ secureEncryptedStorage });
        navigation.goBack();
    }, [getSecureEncrypted, connectToNewDevice, navigation]);

    return (
        <Screen>
            <Screen.Header>
                <Button
                    style={styles.headerButton}
                    size="small"
                    type="secondary"
                    onPress={() => setForceOpen(true)}
                >
                    About Sync
                </Button>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <Icon icon={DeviceLinkExclamationmark96} />
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('security.protectAccount.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('security.protectAccount.subtitle')}
                        </Text>
                    </View>
                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <View key={step} style={styles.stepRow}>
                                <View style={styles.stepNumber}>
                                    <Text variant="bodyM" color="tertiary" monospace>
                                        {index + 1}.
                                    </Text>
                                </View>
                                <View style={styles.stepText}>
                                    <Text variant="bodyM">{t(step)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={handleConnect}>
                        Link device
                    </Button>
                </View>
            </Screen.Content>
            {overlayVisible && (
                <SyncOnboarding onClose={handleOnboardingClose} onFinish={handleOnboardingFinish} />
            )}
        </Screen>
    );
};
