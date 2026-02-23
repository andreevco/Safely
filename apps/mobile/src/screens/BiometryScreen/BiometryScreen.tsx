import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { useBiometryQuery, useSetBiometryEnabled, BiometryType } from '@mobile/features/biometry';
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

import { styles } from './BiometryScreen.styles';

export const BiometryScreen = () => {
    const { onBiometryFinished } = useOnboardingFlow();
    const { data: biometry, isLoading } = useBiometryQuery();
    const { mutateAsync: setBiometryEnabled } = useSetBiometryEnabled();

    useEffect(() => {
        if (biometry?.availableType === null) {
            onBiometryFinished();
        }
    }, [biometry?.availableType, onBiometryFinished]);

    if (isLoading || !biometry) {
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
        return null;
    }

    return (
        <BiometrySupportedScreen
            availableType={biometry.availableType}
            setBiometryEnabled={setBiometryEnabled}
            onFinish={onBiometryFinished}
        />
    );
};

const BiometrySupportedScreen: FC<{
    availableType: BiometryType;
    setBiometryEnabled: (enabled: boolean) => Promise<void>;
    onFinish: () => void;
}> = props => {
    const { availableType, setBiometryEnabled, onFinish } = props;
    const { t } = useTranslation();

    const platformKey = Platform.OS === 'ios' ? 'ios' : 'other';

    const { title, description, picture } = useMemo(() => {
        switch (availableType) {
            case BiometryType.FACE:
                return {
                    title: t(`biometry.face.${platformKey}.title`),
                    description: t(`biometry.face.${platformKey}.description`),
                    picture: <Icon icon={Platform.OS === 'ios' ? FaceidIos96 : FaceidAndroid96} />
                };
            case BiometryType.FINGERPRINT:
                return {
                    title: t(`biometry.fingerprint.${platformKey}.title`),
                    description: t(`biometry.fingerprint.${platformKey}.description`),
                    picture: <Icon icon={Fingerprint96} />
                };
            default:
                return {
                    title: t('biometry.default.title'),
                    description: t('biometry.default.description'),
                    picture: <Icon icon={Fingerprint96} />
                };
        }
    }, [availableType, platformKey, t]);

    const handleEnable = useCallback(async () => {
        await setBiometryEnabled(true);
        onFinish();
    }, [setBiometryEnabled, onFinish]);

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
