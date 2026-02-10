import { authenticateBiometry, useBiometryQuery } from '@mobile/features/biometry';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { PromptAndCheckOptions } from './types';
import { passcodeQueryConfig, promptAndCheck } from './usePasscode';

export function useSecurityCheck() {
    const { data: biometry } = useBiometryQuery();
    const queryClient = useQueryClient();

    const check = useCallback(
        async (options?: PromptAndCheckOptions): Promise<void> => {
            const passcodeLength = await queryClient.ensureQueryData(passcodeQueryConfig);

            if (passcodeLength === null) {
                throw new Error('Passcode is not set');
            }

            if (biometry?.isEnabled) {
                const result = await authenticateBiometry();
                if (result.success) {
                    return;
                }
            }

            await promptAndCheck(options);
        },
        [biometry?.isEnabled, queryClient]
    );

    return { check };
}
