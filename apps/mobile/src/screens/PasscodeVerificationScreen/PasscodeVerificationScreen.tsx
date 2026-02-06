import { usePasscode } from '@mobile/entities/security';
import { PasscodeInput, Screen, Text } from '@mobile/shared/ui';
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import {
    impactAsync,
    ImpactFeedbackStyle,
    notificationAsync,
    NotificationFeedbackType
} from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { styles } from './PasscodeVerificationScreen.styles';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose } = props.route.params;

    const { t } = useTranslation();
    const navigation = useNavigation();
    const passcode = usePasscode();
    const successCalled = useRef(false);
    const { height } = useReanimatedKeyboardAnimation();
    const maxHeight = useSharedValue(0);

    const [inputValue, setInputValue] = useState('');
    const isSuccess = useSharedValue(false);
    const isError = useSharedValue(false);

    useAnimatedReaction(
        () => Math.abs(Math.floor(height.value)),
        value => {
            if (value > maxHeight.value) {
                maxHeight.value = value;
            }
        },
        [maxHeight, height]
    );

    const digitsAmount = passcode.isSet ? passcode.passcodeLength : 4;
    const pinFullyEntered = inputValue.length === digitsAmount;

    const handleInputChange = useCallback((value: string) => {
        void impactAsync(ImpactFeedbackStyle.Light);
        setInputValue(value);
    }, []);

    useEffect(() => {
        return () => {
            if (!successCalled.current) {
                onClose?.();
            }
        };
    }, [onClose]);

    const handleComplete = useCallback(async () => {
        if (isSuccess.value || !passcode.isSet || !passcode.validate) return;

        const isValid = await passcode.validate(inputValue);
        if (isValid) {
            await notificationAsync(NotificationFeedbackType.Success);
            isSuccess.value = true;
            successCalled.current = true;

            setTimeout(() => {
                navigation.goBack();
                onSuccess();
            }, 300);
        } else {
            await notificationAsync(NotificationFeedbackType.Error);
            isError.value = true;

            setTimeout(() => {
                setInputValue('');
                isError.value = false;
            }, 300);
        }
    }, [inputValue, passcode, isSuccess, isError, navigation, onSuccess]);

    useEffect(() => {
        if (pinFullyEntered) {
            void handleComplete();
        }
    }, [pinFullyEntered, handleComplete]);

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: maxHeight.value
    }));

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.CloseButton />
            </Screen.Header>

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
                <Animated.View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('passcode.verify.title')}
                    </Text>
                </Animated.View>

                <PasscodeInput
                    numberOfDigits={digitsAmount}
                    value={inputValue}
                    onChange={handleInputChange}
                    isSuccess={isSuccess}
                    isError={isError}
                />
            </Animated.View>
        </Screen>
    );
};
