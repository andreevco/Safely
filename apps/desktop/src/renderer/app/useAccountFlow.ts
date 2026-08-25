import { useCallback, useState } from 'react';

import {
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

import { PasscodePromptCancelledError } from '../features';

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

    const [draft, setDraft] = useState<AccountDraft | null>(null);

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
                if (!(error instanceof PasscodePromptCancelledError)) {
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

    return { draft, startCreate, startEdit, cancel, save };
}
