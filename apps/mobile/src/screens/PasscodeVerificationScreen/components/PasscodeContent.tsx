import { useNavigation } from '@react-navigation/native';
import {
    impactAsync,
    ImpactFeedbackStyle,
    notificationAsync,
    NotificationFeedbackType
} from 'expo-haptics';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { usePasscode } from '@mobile/entities/security';
import { PASSCODE_DIGITS } from '@mobile/shared/constants';
import { PasscodeInput, Screen, Text } from '@mobile/shared/ui';

import { styles } from '../PasscodeVerificationScreen.styles';

interface PasscodeContentProps {
    onSuccess: () => void;
    successCalled: RefObject<boolean>;
    title?: string;
    recordFailedAttempt: () => Promise<void>;
    resetAttempts: () => Promise<void>;
}

export const PasscodeContent = (props: PasscodeContentProps) => {
    const { onSuccess, successCalled, title, recordFailedAttempt, resetAttempts } = props;

    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const passcode = usePasscode();
    const processingRef = useRef(false);
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

    const digitsAmount = passcode.isSet ? passcode.passcodeLength : PASSCODE_DIGITS.SHORT;
    const pinFullyEntered = inputValue.length === digitsAmount;

    const handleInputChange = useCallback((value: string) => {
        void impactAsync(ImpactFeedbackStyle.Light);
        setInputValue(value);
    }, []);

    const handleComplete = useCallback(async () => {
        if (isSuccess.value || processingRef.current) return;
        processingRef.current = true;

        const isValid = passcode.isSet ? await passcode.validate(inputValue) : false;
        if (isValid) {
            await resetAttempts();
            await notificationAsync(NotificationFeedbackType.Success);
            isSuccess.value = true;
            successCalled.current = true;

            setTimeout(() => {
                navigation.goBack();
                onSuccess();
            }, 300);
        } else {
            await recordFailedAttempt();
            await notificationAsync(NotificationFeedbackType.Error);
            isError.value = true;

            setTimeout(() => {
                setInputValue('');
                isError.value = false;
                processingRef.current = false;
            }, 300);
        }
    }, [
        isSuccess,
        passcode,
        inputValue,
        resetAttempts,
        successCalled,
        navigation,
        onSuccess,
        recordFailedAttempt,
        isError
    ]);

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
                        {title ?? t('passcode.verify.title')}
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
