import { useOnboardingFlow } from '@mobile/features/onboarding';
import { usePasscodeState } from '@mobile/screens/PasscodeModal/hooks';
import { PASSCODE_DIGITS } from '@mobile/shared/constants';
import { Button, PasscodeInput, Screen, Text } from '@mobile/shared/ui';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { styles } from './OnboardingPasscodeScreen.styles';

export const OnboardingPasscodeScreen = () => {
    const { t } = useTranslation();
    const { height, progress } = useReanimatedKeyboardAnimation();
    const { onPasscodeReady } = useOnboardingFlow();
    const inputRef = useRef<TextInput>(null);
    const maxHeight = useSharedValue(0);

    const passcodeState = usePasscodeState();
    const [firstPasscode, setFirstPasscode] = useState<string | null>(null);

    useAnimatedReaction(
        () => Math.abs(Math.floor(height.value)),
        value => {
            if (value > maxHeight.value) {
                maxHeight.value = value;
            }
        },
        [maxHeight, height]
    );

    const isReenterStep = firstPasscode !== null;
    const pinFullyEntered = passcodeState.inputValue.length === passcodeState.digitsAmount;

    const handlePasscodeComplete = useCallback(async () => {
        if (passcodeState.isSuccess.value) return;

        if (!isReenterStep) {
            await notificationAsync(NotificationFeedbackType.Success);
            passcodeState.isSuccess.value = true;

            setTimeout(() => {
                setFirstPasscode(passcodeState.inputValue);
                passcodeState.reset();
            }, 300);
        } else {
            if (passcodeState.inputValue === firstPasscode) {
                await notificationAsync(NotificationFeedbackType.Success);
                passcodeState.isSuccess.value = true;

                setTimeout(() => {
                    onPasscodeReady(passcodeState.inputValue);
                }, 300);
            } else {
                await notificationAsync(NotificationFeedbackType.Error);
                passcodeState.isError.value = true;

                setTimeout(() => {
                    passcodeState.reset();
                }, 300);
            }
        }
    }, [passcodeState, isReenterStep, firstPasscode, onPasscodeReady]);

    useEffect(() => {
        if (pinFullyEntered) {
            void handlePasscodeComplete();
        }
    }, [pinFullyEntered, handlePasscodeComplete]);

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: maxHeight.value
    }));

    const switchButtonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: height.value }]
    }));

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
                <Animated.View style={[styles.textContainer]}>
                    <Text textAlign="center" variant="titleL">
                        {isReenterStep
                            ? t('onboarding.passcode.reenter.title')
                            : t('onboarding.passcode.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {isReenterStep
                            ? t('onboarding.passcode.reenter.description')
                            : t('onboarding.passcode.description')}
                    </Text>
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

            {!isReenterStep && (
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
            )}
        </Screen>
    );
};
