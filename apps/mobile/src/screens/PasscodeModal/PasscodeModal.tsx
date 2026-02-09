import { useNavigation } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { PASSCODE_DIGITS } from '@mobile/shared/constants';
import { Button, PasscodeInput, Screen, Text } from '@mobile/shared/ui';

import { usePasscodeState } from './hooks';
import { styles } from './PasscodeModal.styles';

export interface PasscodeModalProps {
    title?: string;
    subtitle?: string;
}

export const PasscodeModal = (props: PasscodeModalProps) => {
    const { title, subtitle } = props;

    const { t } = useTranslation();
    const { height, progress } = useReanimatedKeyboardAnimation();
    const navigation = useNavigation();
    const inputRef = useRef<TextInput>(null);

    const passcodeState = usePasscodeState();

    const pinFullyEntered = passcodeState.inputValue.length === passcodeState.digitsAmount;

    const handlePasscodeComplete = useCallback(async () => {
        if (!passcodeState.isSuccess.value && pinFullyEntered) {
            await notificationAsync(NotificationFeedbackType.Success);
            passcodeState.isSuccess.value = true;

            // TODO: Save passcode logic
            setTimeout(() => {
                navigation.goBack();
            }, 300);
        }
    }, [passcodeState, pinFullyEntered, navigation]);

    useEffect(() => {
        if (pinFullyEntered) {
            void handlePasscodeComplete();
        }
    }, [pinFullyEntered, handlePasscodeComplete]);

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: -height.value
    }));

    const switchButtonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: height.value }]
    }));

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.CloseButton />
            </Screen.Header>

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
                <Animated.View style={[styles.textContainer]}>
                    <Text textAlign="center" variant="titleL">
                        {title ?? t('passcode.title')}
                    </Text>
                    {subtitle && (
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {subtitle}
                        </Text>
                    )}
                </Animated.View>

                <PasscodeInput
                    ref={inputRef}
                    numberOfDigits={passcodeState.digitsAmount}
                    value={passcodeState.inputValue}
                    onChange={passcodeState.setInputValue}
                    isSuccess={passcodeState.isSuccess}
                    isError={passcodeState.isError}
                />
            </Animated.View>

            <Animated.View style={[styles.stickyButtonContainer, switchButtonAnimatedStyle]}>
                <Button
                    size="small"
                    type="secondary"
                    style={styles.stickyButton}
                    onPress={passcodeState.switchDigitsAmount}
                >
                    {passcodeState.digitsAmount === PASSCODE_DIGITS.SHORT
                        ? t('passcode.switchToSix')
                        : t('passcode.switchToFour')}
                </Button>
            </Animated.View>
        </Screen>
    );
};
