import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';

import { MnemonicResource, PortfolioNetworkType } from '@safely/core';
import { useAppContext, useCreateAccount, useErrorToast, useLoader } from '@safely/ux';

import { ROUTE } from '../../shared';
import { isBiometryAvailable } from '../biometry';
import { usePasscode } from '../passcode';

export type OnboardingStep = 'moreOptions' | 'import' | 'watch' | 'passcode' | 'biometry';

type OnboardingSource =
    | { kind: 'generated' }
    | { kind: 'imported'; mnemonic: string[] }
    | { kind: 'watchOnly'; input: string };

export function useOnboardingFlow() {
    const navigate = useNavigate();
    const { set: setPasscode } = usePasscode();
    const { mutateAsync: createAccount } = useCreateAccount({ setActive: true });
    const { withLoader } = useLoader();
    const errorToast = useErrorToast({
        InvalidMnemonicError: 'importWalletScreen.errors.invalidMnemonic'
    });
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const [step, setStep] = useState<OnboardingStep | null>(null);
    const source = useRef<OnboardingSource | null>(null);

    const close = useCallback(() => {
        source.current = null;
        setStep(null);
    }, []);
    const openMoreOptions = useCallback(() => setStep('moreOptions'), []);
    const openImport = useCallback(() => setStep('import'), []);
    const openWatch = useCallback(() => setStep('watch'), []);

    const startPasscode = useCallback((pending: OnboardingSource) => {
        source.current = pending;
        setStep('passcode');
    }, []);

    const startCreate = useCallback(() => startPasscode({ kind: 'generated' }), [startPasscode]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[]) => startPasscode({ kind: 'imported', mnemonic }),
        [startPasscode]
    );

    const onWatchInputReady = useCallback(
        (input: string) => startPasscode({ kind: 'watchOnly', input }),
        [startPasscode]
    );

    const goBackFromPasscode = useCallback(() => {
        const pending = source.current;
        source.current = null;

        if (pending?.kind === 'imported') {
            setStep('import');
            return;
        }

        setStep(pending?.kind === 'watchOnly' ? 'watch' : null);
    }, []);

    const createAccountFrom = useCallback(
        async (pending: OnboardingSource) => {
            await withLoader(async () => {
                using secureEncryptedStorage = getSecureEncrypted();
                secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

                if (pending.kind === 'imported') {
                    using mnemonicAccessor = new MnemonicResource(pending.mnemonic);

                    await createAccount({
                        secureEncryptedStorage,
                        firstPortfolio: {
                            kind: 'imported',
                            mnemonicAccessor,
                            networkType: PortfolioNetworkType.MAINNET
                        }
                    });
                    return;
                }

                if (pending.kind === 'watchOnly') {
                    await createAccount({
                        secureEncryptedStorage,
                        firstPortfolio: {
                            kind: 'watchOnly',
                            input: pending.input,
                            networkType: PortfolioNetworkType.MAINNET
                        }
                    });
                    return;
                }

                await createAccount({
                    secureEncryptedStorage,
                    firstPortfolio: { kind: 'generated' }
                });
            });
        },
        [withLoader, getSecureEncrypted, createAccount]
    );

    const createAndOpenMain = useCallback(async () => {
        const pending = source.current;

        if (pending === null) {
            return;
        }

        try {
            await createAccountFrom(pending);
        } catch (error) {
            errorToast(error);
            return;
        }

        source.current = null;
        await navigate({ to: ROUTE.main, replace: true });
    }, [createAccountFrom, errorToast, navigate]);

    const onPasscodeComplete = useCallback(
        async (passcode: string) => {
            if (source.current === null) {
                return;
            }

            try {
                await setPasscode(passcode);
            } catch (error) {
                errorToast(error);
                return;
            }

            if (await isBiometryAvailable()) {
                setStep('biometry');
                return;
            }

            await createAndOpenMain();
        },
        [setPasscode, errorToast, createAndOpenMain]
    );

    const onBiometryFinished = useCallback(() => void createAndOpenMain(), [createAndOpenMain]);

    return {
        step,
        close,
        openMoreOptions,
        openImport,
        openWatch,
        startCreate,
        onMnemonicReady,
        onWatchInputReady,
        onPasscodeComplete,
        onBiometryFinished,
        goBackFromPasscode
    };
}
