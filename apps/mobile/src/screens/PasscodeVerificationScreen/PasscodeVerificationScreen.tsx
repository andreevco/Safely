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

import { usePasscodeQuery, validatePasscode } from '@mobile/entities/security';
import { PASSCODE_DIGITS } from '@mobile/shared/constants';
import { PasscodeInput, Screen, Text } from '@mobile/shared/ui';

import { styles } from './PasscodeVerificationScreen.styles';

type PasscodeVerificationScreenProps = StaticScreenProps<{
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
}>;

export const PasscodeVerificationScreen = (props: PasscodeVerificationScreenProps) => {
    const { onSuccess, onClose, title } = props.route.params;

    const { t } = useTranslation();
    const navigation = useNavigation();
    const { data: passcodeLength } = usePasscodeQuery();
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

    const digitsAmount = passcodeLength ?? PASSCODE_DIGITS.SHORT;
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
        if (isSuccess.value) return;

        const isValid = await validatePasscode(inputValue);
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
    }, [inputValue, isSuccess, isError, navigation, onSuccess]);

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
