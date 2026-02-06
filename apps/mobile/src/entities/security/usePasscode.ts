import { navigationRef } from '@mobile/app/navigation/navigationRef';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

import { UsePasscodeResult } from './types';

export const PASSCODE_KEY = 'passcode';

export function usePasscode(): UsePasscodeResult {
    const [isLoading, setIsLoading] = useState(true);
    const [passcodeLength, setPasscodeLength] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        SecureStore.getItemAsync(PASSCODE_KEY).then(stored => {
            if (cancelled) return;
            setPasscodeLength(stored?.length ?? null);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const set = useCallback(async (passcode: string) => {
        await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
        setPasscodeLength(passcode.length);
    }, []);

    const validate = useCallback(async (passcode: string): Promise<boolean> => {
        const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
        if (stored === null) {
            throw new Error('Cannot validate passcode that is not set');
        }
        return stored === passcode;
    }, []);

    const remove = useCallback(async () => {
        await SecureStore.deleteItemAsync(PASSCODE_KEY);
        setPasscodeLength(null);
    }, []);

    const promptAndCheck = useCallback(
        () =>
            new Promise<void>((resolve, reject) => {
                if (navigationRef.current) {
                    navigationRef.current.navigate('PasscodeVerificationModal', {
                        onSuccess: resolve,
                        onClose: reject
                    });
                } else {
                    reject(new Error('Navigation not ready'));
                }
            }),
        []
    );

    if (isLoading) {
        return { isLoading: true, isSet: false };
    }

    if (passcodeLength === null) {
        return { isLoading: false, isSet: false, set };
    }

    return {
        isLoading: false,
        isSet: true,
        passcodeLength,
        set,
        validate,
        remove,
        promptAndCheck
    };
}
