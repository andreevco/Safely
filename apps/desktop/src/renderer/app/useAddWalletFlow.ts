import { useCallback, useRef, useState } from 'react';

import type { PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
import {
    MnemonicResource,
    PortfolioAlreadyExistsError,
    PortfolioIdBip39Imported,
    PortfolioIdBip39MasterKeyDerived,
    PortfolioNetworkType,
    PortfolioWatchOnlyBtc,
    toPortfolioIdWatchOnly
} from '@safely/core';
import {
    useActiveAccountStoreSlot,
    useAddWatchOnlyPortfolio,
    useAppContext,
    useGeneratePortfolio,
    useImportPortfolio,
    useLoader,
    useNewPortfolioFallbackName,
    useToast,
    useTranslate,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';
import { PasscodePromptCancelledError } from '@safely/web-ui';

export type AddWalletDraft = Pick<PortfolioMeta, 'name' | 'icon'>;

export type AddWalletStep = 'menu' | 'import' | 'watch' | 'customize';

type AddWalletSource =
    | { kind: 'generated' }
    | { kind: 'imported'; mnemonic: string[]; networkType: PortfolioNetworkType }
    | { kind: 'watchOnly'; input: string };

export function useAddWalletFlow() {
    const { withLoader } = useLoader();
    const t = useTranslate();
    const toast = useToast();
    const defaultName = useNewPortfolioFallbackName();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: addWatchOnlyPortfolio } = useAddWatchOnlyPortfolio();
    const nextDerivingInfo = useActiveAccountStoreSlot('nextDerivingPortfolioInfo');
    const createEncryptor = useUnlockableSecretEncryptorFactory();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const [step, setStep] = useState<AddWalletStep | null>(null);
    const [draft, setDraft] = useState<AddWalletDraft | null>(null);

    const source = useRef<AddWalletSource | null>(null);
    const networkType = useRef<PortfolioNetworkType>(PortfolioNetworkType.MAINNET);

    const open = useCallback(() => {
        source.current = null;
        setDraft(null);
        setStep('menu');
    }, []);

    const close = useCallback(() => {
        source.current = null;
        setDraft(null);
        setStep(null);
    }, []);

    const openImport = useCallback((network: PortfolioNetworkType) => {
        networkType.current = network;
        setStep('import');
    }, []);

    const openWatch = useCallback(() => setStep('watch'), []);

    const startCreate = useCallback(() => {
        const icon: PortfolioMetaIcon = nextDerivingInfo?.emoji
            ? { type: 'emoji', value: nextDerivingInfo.emoji }
            : PortfolioIdBip39MasterKeyDerived.getFallbackEmoji(nextDerivingInfo?.index ?? 0);

        source.current = { kind: 'generated' };
        setDraft({ name: defaultName, icon });
        setStep('customize');
    }, [nextDerivingInfo, defaultName]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[]) => {
            using mnemonicAccessor = new MnemonicResource(mnemonic);

            source.current = { kind: 'imported', mnemonic, networkType: networkType.current };
            setDraft({
                name: defaultName,
                icon: PortfolioIdBip39Imported.getFallbackEmoji(mnemonicAccessor)
            });
            setStep('customize');
        },
        [defaultName]
    );

    const onWatchInputReady = useCallback(
        (input: string) => {
            const id = PortfolioWatchOnlyBtc.resolveUserInput(input, PortfolioNetworkType.MAINNET);

            source.current = { kind: 'watchOnly', input };
            setDraft({ name: defaultName, icon: toPortfolioIdWatchOnly(id).getFallbackEmoji() });
            setStep('customize');
        },
        [defaultName]
    );

    const save = useCallback(
        async (meta: AddWalletDraft) => {
            const pending = source.current;

            if (pending === null) {
                return;
            }

            close();

            try {
                await withLoader(async () => {
                    if (pending.kind === 'watchOnly') {
                        await addWatchOnlyPortfolio({ input: pending.input, meta });
                        return;
                    }

                    if (pending.kind === 'imported') {
                        using secretEncryptor = createEncryptor();
                        await secretEncryptor.unlockEncryption();

                        using mnemonicAccessor = new MnemonicResource(pending.mnemonic);
                        await importPortfolio({
                            mnemonicAccessor,
                            secretEncryptor,
                            meta,
                            networkType: pending.networkType
                        });
                        return;
                    }

                    using secureEncryptedStorage = getSecureEncrypted();
                    await secureEncryptedStorage.unlock();

                    await generatePortfolio({ meta, secureEncryptedStorage });
                });
            } catch (error) {
                if (error instanceof PortfolioAlreadyExistsError) {
                    toast(
                        t('walletAlreadyAdded.title', {
                            name: error.existingPortfolio?.meta.name ?? ''
                        })
                    );
                    return;
                }

                if (!(error instanceof PasscodePromptCancelledError)) {
                    throw error;
                }
            }
        },
        [
            close,
            withLoader,
            addWatchOnlyPortfolio,
            createEncryptor,
            importPortfolio,
            getSecureEncrypted,
            generatePortfolio,
            toast,
            t
        ]
    );

    return {
        step,
        draft,
        open,
        close,
        openImport,
        openWatch,
        startCreate,
        onMnemonicReady,
        onWatchInputReady,
        save
    };
}
