import { useCallback, useState } from 'react';

import type { PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
import { PortfolioIdBip39MasterKeyDerived } from '@safely/core';
import {
    useActiveAccountStoreSlot,
    useAppContext,
    useGeneratePortfolio,
    useLoader,
    useNewPortfolioFallbackName
} from '@safely/ux';
import { PasscodePromptCancelledError } from '@safely/web-ui';

export type AddWalletDraft = Pick<PortfolioMeta, 'name' | 'icon'>;

export function useAddWallet() {
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const nextDerivingInfo = useActiveAccountStoreSlot('nextDerivingPortfolioInfo');
    const defaultName = useNewPortfolioFallbackName();
    const { withLoader } = useLoader();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const [draft, setDraft] = useState<AddWalletDraft | null>(null);

    const start = useCallback(() => {
        const icon: PortfolioMetaIcon = nextDerivingInfo?.emoji
            ? { type: 'emoji', value: nextDerivingInfo.emoji }
            : PortfolioIdBip39MasterKeyDerived.getFallbackEmoji(nextDerivingInfo?.index ?? 0);

        setDraft({ name: defaultName, icon });
    }, [nextDerivingInfo, defaultName]);

    const cancel = useCallback(() => setDraft(null), []);

    const save = useCallback(
        async (meta: AddWalletDraft) => {
            setDraft(null);

            try {
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();

                    await secureEncryptedStorage.unlock();
                    await generatePortfolio({ meta, secureEncryptedStorage });
                });
            } catch (error) {
                if (!(error instanceof PasscodePromptCancelledError)) {
                    throw error;
                }
            }
        },
        [withLoader, getSecureEncrypted, generatePortfolio]
    );

    return { draft, start, cancel, save };
}
