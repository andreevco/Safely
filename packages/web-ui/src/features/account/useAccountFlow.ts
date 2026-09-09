import { useCallback, useRef, useState } from 'react';

import type { IUnlockableSecuredEncryptedStorage, OnboardedAccount } from '@safely/ux';
import {
    SecurityCheckCancelledError,
    useAccountConnectedCallback,
    useActiveAccountMeta,
    useAppContext,
    useChangeAccountMeta,
    useCreateAccountFromSource,
    useCreateExistingAccountConnector,
    useErrorToast,
    useLoader,
    useNewAccountDefaultName,
    useToast,
    useTranslate
} from '@safely/ux';

import { useSignOut } from './useSignOut';

type AccountDraft = { mode: 'create' | 'edit'; name: string };

type AddAccountStep = 'menu' | 'signIn' | 'signInSuccess';

export function useAccountFlow() {
    const t = useTranslate();
    const toast = useToast();
    const { withLoader } = useLoader();
    const defaultName = useNewAccountDefaultName();
    const errorToast = useErrorToast({});
    const activeMeta = useActiveAccountMeta();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();
    const { mutateAsync: createAccount } = useCreateAccountFromSource();

    const signOutAccount = useSignOut();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const signIn = useCreateExistingAccountConnector();
    const signInStorage = useRef<IUnlockableSecuredEncryptedStorage | null>(null);

    const [draft, setDraft] = useState<AccountDraft | null>(null);
    const [addStep, setAddStep] = useState<AddAccountStep | null>(null);
    const [inviterIkPubHex, setInviterIkPubHex] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const closeSignInStorage = useCallback(() => {
        signInStorage.current?.[Symbol.dispose]();
        signInStorage.current = null;
    }, []);

    const openAdd = useCallback(() => setAddStep('menu'), []);

    const closeAdd = useCallback(() => {
        signIn.reset();
        closeSignInStorage();
        setAddStep(null);
    }, [signIn, closeSignInStorage]);

    const startCreate = useCallback(() => {
        setAddStep(null);
        setDraft({ mode: 'create', name: defaultName });
    }, [defaultName]);

    const startSignIn = useCallback(async () => {
        signIn.reset();

        const secureEncryptedStorage = getSecureEncrypted();

        try {
            await secureEncryptedStorage.unlock();
        } catch (error) {
            secureEncryptedStorage[Symbol.dispose]();

            if (!(error instanceof SecurityCheckCancelledError)) {
                errorToast(error);
            }
            return;
        }

        signInStorage.current = secureEncryptedStorage;

        try {
            await signIn.mutateAsync({ secureEncryptedStorage });
        } catch (error) {
            closeSignInStorage();
            errorToast(error);
            return;
        }

        setAddStep('signIn');
    }, [signIn, getSecureEncrypted, closeSignInStorage, errorToast]);

    const onAccountConnected = useCallback(
        (onboarded: OnboardedAccount) => {
            closeSignInStorage();
            setInviterIkPubHex(onboarded.inviterIkPubHex);
            setAddStep('signInSuccess');
        },
        [closeSignInStorage]
    );

    const onAccountConnectFailed = useCallback(() => {
        closeSignInStorage();
        setAddStep(null);
        toast({ message: t('signIn.timeout'), duration: 5000 });
    }, [closeSignInStorage, toast, t]);

    useAccountConnectedCallback(signIn.data, onAccountConnected, {
        setAsActive: true,
        onError: onAccountConnectFailed
    });

    const startEdit = useCallback(
        () => setDraft({ mode: 'edit', name: activeMeta.name }),
        [activeMeta.name]
    );

    const cancel = useCallback(() => setDraft(null), []);

    const save = useCallback(
        async (name: string) => {
            const mode = draft?.mode;

            if (mode === undefined) {
                return;
            }

            setDraft(null);

            try {
                if (mode === 'edit') {
                    await withLoader(() => changeAccountMeta({ name }));
                    return;
                }

                await createAccount({ name, source: { kind: 'generated' } });
            } catch (error) {
                if (!(error instanceof SecurityCheckCancelledError)) {
                    errorToast(error);
                }
            }
        },
        [draft, withLoader, changeAccountMeta, createAccount, errorToast]
    );

    const startSignOut = useCallback(() => setIsSigningOut(true), []);

    const cancelSignOut = useCallback(() => setIsSigningOut(false), []);

    const signOut = useCallback(async () => {
        setIsSigningOut(false);
        await signOutAccount();
    }, [signOutAccount]);

    return {
        draft,
        addStep,
        connectionString: signIn.data?.connectionString,
        inviterIkPubHex,
        isSigningOut,
        openAdd,
        closeAdd,
        startCreate,
        startSignIn,
        startEdit,
        cancel,
        save,
        startSignOut,
        cancelSignOut,
        signOut
    };
}
