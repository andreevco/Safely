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

import { usePasscodeState } from '@mobile/screens/PasscodeModal/hooks';
import { PASSCODE_DIGITS } from '@mobile/shared/constants';
import { Button, PasscodeInput, Screen, Text } from '@mobile/shared/ui';

import { styles } from './PasscodeSetup.styles';

type PasscodeSetupProps = {
    headerType: 'back' | 'close';
    title: string;
    reenterTitle: string;
    description?: string;
    reenterDescription?: string;
    onComplete: (passcode: string) => void | Promise<void>;
};

export const PasscodeSetup = ({
    headerType,
    title,
    reenterTitle,
    description,
    reenterDescription,
    onComplete
}: PasscodeSetupProps) => {
    const { t } = useTranslation();
    const { height, progress } = useReanimatedKeyboardAnimation();
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
                    void onComplete(passcodeState.inputValue);
                }, 300);
            } else {
                await notificationAsync(NotificationFeedbackType.Error);
                passcodeState.isError.value = true;

                setTimeout(() => {
                    passcodeState.reset();
                }, 300);
            }
        }
    }, [passcodeState, isReenterStep, firstPasscode, onComplete]);

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

    const currentTitle = isReenterStep ? reenterTitle : title;
    const currentDescription = isReenterStep ? reenterDescription : description;

    return (
        <Screen>
            <Screen.Header variant="left">
                {headerType === 'back' ? (
                    <Screen.Header.BackButton />
                ) : (
                    <Screen.Header.CloseButton />
                )}
            </Screen.Header>

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
                <Animated.View style={[styles.textContainer]}>
                    <Text textAlign="center" variant="titleM">
                        {currentTitle}
                    </Text>
                    {currentDescription && (
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {currentDescription}
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
