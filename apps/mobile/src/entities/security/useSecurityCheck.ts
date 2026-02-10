import { useBiometry } from '@mobile/features/biometry';
import { useCallback, useRef, useEffect } from 'react';

import { PromptAndCheckOptions } from './types';
import { usePasscode } from './usePasscode';

export function useSecurityCheck() {
    const biometry = useBiometry();
    const passcode = usePasscode();

    const passcodeRef = useRef(passcode);
    useEffect(() => {
        passcodeRef.current = passcode;
    }, [passcode]);

    const check = useCallback(
        async (options?: PromptAndCheckOptions): Promise<void> => {
            let currentPasscode = passcodeRef.current;
            while (currentPasscode.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 50));
                currentPasscode = passcodeRef.current;
            }

            if (!currentPasscode.isSet) {
                throw new Error('Passcode is not set');
            }

            if (biometry.isEnabled && biometry.authenticate) {
                const result = await biometry.authenticate();
                if (result.success) {
                    return;
                }
            }

            await currentPasscode.promptAndCheck(options);
        },
        [biometry.isEnabled, biometry.authenticate]
    );

    return { check, passcode, biometry };
}
