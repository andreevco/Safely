import type { StaticScreenProps } from '@react-navigation/native';
import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import {
    BiometryType,
    getBiometryIcon,
    useBiometryQuery,
    useSetBiometryEnabled
} from '@mobile/features/biometry';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { TEST_ID } from '@mobile/shared/constants';
import { Button, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './BiometryScreen.styles';

type BiometryScreenProps = StaticScreenProps<{
    isSignIn: boolean;
}>;

export const BiometryScreen = (props: BiometryScreenProps) => {
    const { isSignIn } = props.route.params;
    const { onBiometryFinished } = useOnboardingFlow();
    const { data: biometry, isLoading } = useBiometryQuery();
    const { mutateAsync: setBiometryEnabled } = useSetBiometryEnabled();

    const handleFinished = useCallback(
        () => onBiometryFinished(isSignIn),
        [onBiometryFinished, isSignIn]
    );

    useEffect(() => {
        if (biometry?.availableType === null) {
            handleFinished();
        }
    }, [biometry?.availableType, handleFinished]);

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
            onFinish={handleFinished}
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
        const icon = getBiometryIcon(availableType);

        switch (availableType) {
            case BiometryType.FACE:
                return {
                    title: t(`biometry.face.${platformKey}.title`),
                    description: t(`biometry.face.${platformKey}.description`),
                    picture: <Icon icon={icon} />
                };
            case BiometryType.FINGERPRINT:
                return {
                    title: t(`biometry.fingerprint.${platformKey}.title`),
                    description: t(`biometry.fingerprint.${platformKey}.description`),
                    picture: <Icon icon={icon} />
                };
            default:
                return {
                    title: t('biometry.default.title'),
                    description: t('biometry.default.description'),
                    picture: <Icon icon={icon} />
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
            <Screen.Header withCompensateHeight={false}>
                <View />
                <Screen.Header.Button
                    testID={TEST_ID.biometry.skip}
                    type="small"
                    onPress={handleSkip}
                >
                    <Text variant="labelM">{t('common.later')}</Text>
                </Screen.Header.Button>
            </Screen.Header>
            <View style={styles.content}>
                <View style={styles.iconContainer}>{picture}</View>
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
        </Screen>
    );
};
