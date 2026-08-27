import { useCallback, useState } from 'react';

import {
    SecurityCheckCancelledError,
    useActiveAccountMeta,
    useAppContext,
    useChangeAccountMeta,
    useCreateAccount,
    useErrorToast,
    useLoader,
    useNewAccountDefaultName,
    useToast,
    useTranslate
} from '@safely/ux';

import { useSignOut } from './useSignOut';

type AccountDraft = { mode: 'create' | 'edit'; name: string };

export function useAccountFlow() {
    const { withLoader } = useLoader();
    const t = useTranslate();
    const defaultName = useNewAccountDefaultName();
    const errorToast = useErrorToast({});
    const activeMeta = useActiveAccountMeta();
    const toast = useToast();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();
    const { mutateAsync: createAccount } = useCreateAccount({ setActive: true });
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const signOutAccount = useSignOut();

    const [draft, setDraft] = useState<AccountDraft | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const startCreate = useCallback(
        () => setDraft({ mode: 'create', name: defaultName }),
        [defaultName]
    );

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

                using secureEncryptedStorage = getSecureEncrypted();
                await secureEncryptedStorage.unlock();

                await withLoader(() =>
                    createAccount({
                        name,
                        secureEncryptedStorage,
                        firstPortfolio: { kind: 'generated' }
                    })
                );

                toast(t('addAccount.toastAccountCreated'));
            } catch (error) {
                if (!(error instanceof SecurityCheckCancelledError)) {
                    errorToast(error);
                }
            }
        },
        [
            draft,
            withLoader,
            changeAccountMeta,
            getSecureEncrypted,
            createAccount,
            toast,
            t,
            errorToast
        ]
    );

    const startSignOut = useCallback(() => setIsSigningOut(true), []);

    const cancelSignOut = useCallback(() => setIsSigningOut(false), []);

    const signOut = useCallback(async () => {
        setIsSigningOut(false);
        await signOutAccount();
    }, [signOutAccount]);

    return {
        draft,
        isSigningOut,
        startCreate,
        startEdit,
        cancel,
        save,
        startSignOut,
        cancelSignOut,
        signOut
    };
}
