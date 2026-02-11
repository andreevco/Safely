import { useCallback } from 'react';

import { authenticateBiometry, useBiometryQuery } from '@mobile/features/biometry';

import { PromptAndCheckOptions } from './types';
import { usePasscode } from './usePasscode';

export function useSecurityCheck() {
    const { data: biometry } = useBiometryQuery();
    const passcode = usePasscode();

    return useCallback(
        async (options?: PromptAndCheckOptions) => {
            if (!passcode.isSet) {
                throw new Error('Passcode is not set');
            }
            if (biometry?.isEnabled) {
                const result = await authenticateBiometry();
                if (result.success) {
                    return;
                }
            }
            await passcode.promptAndCheck(options);
        },
        [biometry?.isEnabled, passcode.isSet, passcode.promptAndCheck]
    );
}
