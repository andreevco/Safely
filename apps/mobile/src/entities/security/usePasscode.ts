import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { passcodeKeys } from './keys';
import { PromptAndCheckOptions } from './types';

const PASSCODE_KEY = 'passcode';

export const passcodeQueryConfig = {
    queryKey: passcodeKeys.state.toKey(),
    queryFn: async () => {
        const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
        return stored?.length ?? null;
    },
    staleTime: Infinity
};

export function usePasscodeQuery() {
    return useQuery(passcodeQueryConfig);
}

export function useSetPasscode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (passcode: string) => {
            await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({ queryKey: passcodeKeys.state.toKey() });
        }
    });
}

export function useRemovePasscode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await SecureStore.deleteItemAsync(PASSCODE_KEY);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({ queryKey: passcodeKeys.state.toKey() });
        }
    });
}

export async function validatePasscode(passcode: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
    if (stored === null) {
        throw new Error('Cannot validate passcode that is not set');
    }
    return stored === passcode;
}

export function promptAndCheck(options?: PromptAndCheckOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (navigationRef.current) {
            navigationRef.current.navigate('PasscodeVerificationModal', {
                onSuccess: resolve,
                onClose: reject,
                title: options?.title
            });
        } else {
            reject(new Error('Navigation not ready'));
        }
    });
}
