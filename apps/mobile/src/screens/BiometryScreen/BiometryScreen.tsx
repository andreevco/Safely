import { useBiometry, BiometryType } from '@mobile/features/biometry';
import type { UseBiometryResultSupported } from '@mobile/features/biometry';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import {
    Button,
    FaceidAndroid96,
    FaceidIos96,
    Fingerprint96,
    Icon,
    Screen,
    Text
} from '@mobile/shared/ui';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { styles } from './BiometryScreen.styles';

export const BiometryScreen = () => {
    const { onBiometryFinished } = useOnboardingFlow();
    const biometry = useBiometry();

    if (biometry.isLoading) {
        return (
            <Screen>
                <Screen.Header variant="left">
                    <Screen.Header.BackButton />
                </Screen.Header>
                <Screen.Content>{null}</Screen.Content>
            </Screen>
        );
    }

    if (biometry.availableType === null) {
        onBiometryFinished();

        return null;
    }

    return <BiometrySupportedScreen onFinish={onBiometryFinished} biometry={biometry} />;
};

const BiometrySupportedScreen: FC<{
    biometry: UseBiometryResultSupported;
    onFinish: () => void;
}> = ({ biometry, onFinish }) => {
    const { t } = useTranslation();

    const { title, description, picture } = useMemo(() => {
        switch (biometry.availableType) {
            case BiometryType.FACE:
                return {
                    title: t(`biometry.face.${Platform.OS}.title`),
                    description: t(`biometry.face.${Platform.OS}.description`),
                    picture: <Icon icon={Platform.OS === 'ios' ? FaceidIos96 : FaceidAndroid96} />
                };
            case BiometryType.FINGERPRINT:
                return {
                    title: t(`biometry.fingerprint.${Platform.OS}.title`),
                    description: t(`biometry.fingerprint.${Platform.OS}.description`),
                    picture: <Icon icon={Fingerprint96} />
                };
            default:
                return {
                    title: t('biometry.default.title'),
                    description: t('biometry.default.description'),
                    picture: <Icon icon={Fingerprint96} />
                };
        }
    }, [biometry.availableType, t]);

    const handleEnable = useCallback(async () => {
        await biometry.setEnabled(true);
        onFinish();
    }, [biometry, onFinish]);

    const handleSkip = useCallback(() => {
        onFinish();
    }, [onFinish]);

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
                    {picture}
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {title}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {description}
                        </Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button type="primary" size="large" onPress={handleEnable}>
                        {t('biometry.enable', { name: title })}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
