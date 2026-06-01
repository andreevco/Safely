import { useCallback } from 'react';

import type { PromptAndCheckOptions } from '@mobile/entities/security';
import { usePasscode } from '@mobile/entities/security';
import { authenticateBiometry, useBiometryQuery } from '@mobile/features/biometry';

export function useMobileSecurityCheck() {
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
