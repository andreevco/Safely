import { useCallback, useRef, useState } from 'react';

import type { Portfolio, PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
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
    useChangePortfolioMeta,
    useGeneratePortfolio,
    useImportPortfolio,
    useLoader,
    useNewPortfolioFallbackName,
    usePortfolios,
    useSetActivePortfolio,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';
import { PasscodePromptCancelledError } from '@safely/web-ui';

export type AddWalletDraft = Pick<PortfolioMeta, 'name' | 'icon'>;

export type AddWalletStep = 'menu' | 'import' | 'watch' | 'duplicate' | 'customize';

type AddWalletSource =
    | { kind: 'generated' }
    | { kind: 'imported'; mnemonic: string[]; networkType: PortfolioNetworkType }
    | { kind: 'watchOnly'; input: string }
    | { kind: 'existing'; portfolio: Portfolio };

export function useAddWalletFlow() {
    const { withLoader } = useLoader();
    const portfolios = usePortfolios();
    const defaultName = useNewPortfolioFallbackName();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();
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
    const [duplicate, setDuplicate] = useState<Portfolio | null>(null);

    const source = useRef<AddWalletSource | null>(null);
    const networkType = useRef<PortfolioNetworkType>(PortfolioNetworkType.MAINNET);

    const open = useCallback(() => {
        source.current = null;
        setDraft(null);
        setDuplicate(null);
        setStep('menu');
    }, []);

    const close = useCallback(() => {
        source.current = null;
        setDraft(null);
        setDuplicate(null);
        setStep(null);
    }, []);

    const openImport = useCallback((network: PortfolioNetworkType) => {
        networkType.current = network;
        setStep('import');
    }, []);

    const openWatch = useCallback(() => setStep('watch'), []);

    const showDuplicate = useCallback((portfolio: Portfolio) => {
        setDuplicate(portfolio);
        setStep('duplicate');
    }, []);

    const startCreate = useCallback(() => {
        const icon: PortfolioMetaIcon = nextDerivingInfo?.emoji
            ? { type: 'emoji', value: nextDerivingInfo.emoji }
            : PortfolioIdBip39MasterKeyDerived.getFallbackEmoji(nextDerivingInfo?.index ?? 0);

        source.current = { kind: 'generated' };
        setDraft({ name: defaultName, icon });
        setStep('customize');
    }, [nextDerivingInfo, defaultName]);

    const onMnemonicReady = useCallback(
        async (mnemonic: string[]) => {
            using mnemonicAccessor = new MnemonicResource(mnemonic);

            const id = await PortfolioIdBip39Imported.create(mnemonicAccessor, networkType.current);
            const existing = portfolios.find(portfolio => portfolio.id.isEq(id));

            if (existing) {
                showDuplicate(existing);
                return;
            }

            source.current = { kind: 'imported', mnemonic, networkType: networkType.current };
            setDraft({
                name: defaultName,
                icon: PortfolioIdBip39Imported.getFallbackEmoji(mnemonicAccessor)
            });
            setStep('customize');
        },
        [portfolios, showDuplicate, defaultName]
    );

    const onWatchInputReady = useCallback(
        (input: string) => {
            const id = toPortfolioIdWatchOnly(
                PortfolioWatchOnlyBtc.resolveUserInput(input, PortfolioNetworkType.MAINNET)
            );
            const existing = portfolios.find(portfolio => portfolio.id.isEq(id));

            if (existing) {
                showDuplicate(existing);
                return;
            }

            source.current = { kind: 'watchOnly', input };
            setDraft({ name: defaultName, icon: id.getFallbackEmoji() });
            setStep('customize');
        },
        [portfolios, showDuplicate, defaultName]
    );

    const openDuplicate = useCallback(async () => {
        if (duplicate === null) {
            return;
        }

        close();
        await setActivePortfolio({ id: duplicate.id });
    }, [duplicate, close, setActivePortfolio]);

    const editDuplicate = useCallback(() => {
        if (duplicate === null) {
            return;
        }

        source.current = { kind: 'existing', portfolio: duplicate };
        setDraft({ name: duplicate.meta.name, icon: duplicate.meta.icon });
        setStep('customize');
    }, [duplicate]);

    const save = useCallback(
        async (meta: AddWalletDraft) => {
            const pending = source.current;

            if (pending === null) {
                return;
            }

            close();

            try {
                await withLoader(async () => {
                    if (pending.kind === 'existing') {
                        await changePortfolioMeta({ portfolio: pending.portfolio, meta });
                        await setActivePortfolio({ id: pending.portfolio.id });
                        return;
                    }

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
                if (error instanceof PortfolioAlreadyExistsError && error.existingPortfolio) {
                    const existingId = error.existingPortfolio.id;
                    const existing = portfolios.find(portfolio => portfolio.id.isEq(existingId));

                    if (existing) {
                        showDuplicate(existing);
                        return;
                    }
                }

                if (!(error instanceof PasscodePromptCancelledError)) {
                    throw error;
                }
            }
        },
        [
            close,
            withLoader,
            changePortfolioMeta,
            setActivePortfolio,
            addWatchOnlyPortfolio,
            createEncryptor,
            importPortfolio,
            getSecureEncrypted,
            generatePortfolio,
            portfolios,
            showDuplicate
        ]
    );

    return {
        step,
        draft,
        duplicate,
        open,
        close,
        openImport,
        openWatch,
        startCreate,
        onMnemonicReady,
        onWatchInputReady,
        openDuplicate,
        editDuplicate,
        save
    };
}
