import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { useAppContext, useCreateAccount, useErrorToast, useLoader } from '@safely/ux';

import { ROUTE } from './routes';
import type { PasscodeStorage } from '../entities';
import { usePasscode } from '../entities';

export function useOnboardingFlow(passcodeStorage: PasscodeStorage) {
    const navigate = useNavigate();
    const { set: setPasscode } = usePasscode(passcodeStorage);
    const { mutateAsync: createAccount } = useCreateAccount({ setActive: true });
    const { withLoader } = useLoader();
    const errorToast = useErrorToast({});
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const onPasscodeConfirmed = useCallback(
        async (passcode: string) => {
            await setPasscode(passcode);

            try {
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();
                    secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

                    await createAccount({
                        secureEncryptedStorage,
                        firstPortfolio: { kind: 'generated' }
                    });
                });
            } catch (error) {
                errorToast(error);
                await navigate(ROUTE.onboarding.passcode, { replace: true });
                return;
            }

            await navigate(ROUTE.main, { replace: true });
        },
        [setPasscode, withLoader, getSecureEncrypted, createAccount, errorToast, navigate]
    );

    return { onPasscodeConfirmed };
}
