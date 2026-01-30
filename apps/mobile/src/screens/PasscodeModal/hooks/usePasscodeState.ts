import { PASSCODE_DIGITS, PasscodeDigits } from '@mobile/shared/constants';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

export interface PasscodeState {
    digitsAmount: PasscodeDigits;
    switchDigitsAmount: () => void;
    inputValue: string;
    setInputValue: (value: string) => void;
    isSuccess: SharedValue<boolean>;
    isError: SharedValue<boolean>;
    reset: () => void;
}

export const usePasscodeState = (): PasscodeState => {
    const [digitsAmount, setDigitsAmount] = useState<PasscodeDigits>(PASSCODE_DIGITS.SHORT);
    const [inputValue, _setInputValue] = useState('');
    const isSuccess = useSharedValue<boolean>(false);
    const isError = useSharedValue<boolean>(false);

    const switchDigitsAmount = useCallback(() => {
        void impactAsync();
        _setInputValue('');
        isSuccess.value = false;
        isError.value = false;
        setDigitsAmount(prev =>
            prev === PASSCODE_DIGITS.SHORT ? PASSCODE_DIGITS.LONG : PASSCODE_DIGITS.SHORT
        );
    }, [isSuccess, isError]);

    const setInputValue = useCallback((value: string) => {
        impactAsync(ImpactFeedbackStyle.Light);
        _setInputValue(value);
    }, []);

    const reset = useCallback(() => {
        _setInputValue('');
        isSuccess.value = false;
        isError.value = false;
    }, [isSuccess, isError]);

    return useMemo(
        () => ({
            digitsAmount,
            switchDigitsAmount,
            inputValue,
            setInputValue,
            isSuccess,
            isError,
            reset
        }),
        [digitsAmount, switchDigitsAmount, inputValue, setInputValue, isSuccess, isError, reset]
    );
};
