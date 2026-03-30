import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAppContext, useConnectAccountToNewDevice } from '@safely/ux';

import { Button, DeviceLinkExclamationmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './ProtectAccountModal.styles';

const steps = [
    'onboarding.accountCreated.steps.step1',
    'onboarding.accountCreated.steps.step2',
    'onboarding.accountCreated.steps.step3'
] as const;

export const ProtectAccountModal = () => {
    const { t } = useTranslation();
    const { getSecureEncryptedStorage } = useAppContext();
    const { mutateAsync: connectToNewDevice } = useConnectAccountToNewDevice();
    const navigation = useNavigation();

    const handleConnect = useCallback(async () => {
        using secureEncryptedStorage = getSecureEncryptedStorage();
        await secureEncryptedStorage.unlock();

        await connectToNewDevice({ secureEncryptedStorage });
        navigation.goBack();
    }, [getSecureEncryptedStorage, connectToNewDevice, navigation]);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
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
                                    <Text variant="labelM" color="tertiary" monospace>
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
                        {t('onboarding.accountCreated.addDevice')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
