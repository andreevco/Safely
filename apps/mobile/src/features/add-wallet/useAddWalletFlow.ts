import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';

import type { PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
import { PortfolioIdBip39Imported } from '@safely/core';
import { PortfolioIdBip39MasterKeyDerived } from '@safely/core';
import { MnemonicResource, PortfolioNetworkType } from '@safely/core';
import { saf751, saf751Async } from '@safely/sync';
import {
    useActiveAccountStoreSlot,
    useAppContext,
    useGeneratePortfolio,
    useImportPortfolio,
    useNewPortfolioFallbackName,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';

import { handleDuplicatePortfolio } from './handleDuplicatePortfolio';

const routes = {
    importWallet: 'ImportWalletModal',
    addWatchOnly: 'AddWatchOnlyModal',
    connectLedger: 'ConnectLedgerModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const nextGeneratingPortfolioInfo = useActiveAccountStoreSlot('nextDerivingPortfolioInfo');
    const createEncryptor = useUnlockableSecretEncryptorFactory();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const defaultName = useNewPortfolioFallbackName();

    const startCreateFlow = useCallback(() => {
        let defaultIcon: PortfolioMetaIcon;
        if (nextGeneratingPortfolioInfo?.emoji) {
            defaultIcon = { type: 'emoji', value: nextGeneratingPortfolioInfo.emoji };
        } else {
            defaultIcon = PortfolioIdBip39MasterKeyDerived.getFallbackEmoji(
                nextGeneratingPortfolioInfo?.index ?? 0
            );
        }

        navigation.navigate(routes.customize, {
            defaultIcon,
            defaultName,
            onSave: async (meta: PortfolioMeta) => {
                using secureEncryptedStorage = getSecureEncrypted();
                await secureEncryptedStorage.unlock();

                await generatePortfolio({ meta, secureEncryptedStorage });

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'TabsNavigator' }]
                    })
                );
            },
            onClose: () => {
                navigation.goBack();
            }
        });
    }, [
        navigation,
        generatePortfolio,

        getSecureEncrypted,
        nextGeneratingPortfolioInfo,
        defaultName
    ]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate(routes.importWallet, {
                networkType: PortfolioNetworkType.MAINNET
            })
        );
    }, [navigation]);

    const startTestnetImportFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate(routes.importWallet, {
                networkType: PortfolioNetworkType.TESTNET
            })
        );
    }, [navigation]);

    const startWatchOnlyFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.addWatchOnly));
    }, [navigation]);

    const startConnectLedgerFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.connectLedger));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[], networkType: PortfolioNetworkType) => {
            saf751('addWallet.mnemonicReady', { words: mnemonic.length, networkType });

            using accessor = new MnemonicResource(mnemonic);
            const defaultIcon = PortfolioIdBip39Imported.getFallbackEmoji(accessor);

            navigation.navigate(routes.customize, {
                defaultIcon,
                defaultName,
                onSave: async (meta: PortfolioMeta) => {
                    saf751('addWallet.save:start');

                    try {
                        using secretEncryptor = createEncryptor();
                        await saf751Async('addWallet.unlockEncryption', () =>
                            secretEncryptor.unlockEncryption()
                        );

                        using mnemonicAccessor = new MnemonicResource(mnemonic);
                        await saf751Async('addWallet.importPortfolio', () =>
                            importPortfolio({
                                mnemonicAccessor,
                                secretEncryptor,
                                meta,
                                networkType
                            })
                        );

                        saf751('addWallet.save:ok');

                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    } catch (error) {
                        saf751('addWallet.save:fail', { error: String(error) });
                        handleDuplicatePortfolio(error, navigation);
                    }
                },
                onClose: () => {
                    navigation.goBack();
                }
            });
        },
        [navigation, importPortfolio, createEncryptor, defaultName]
    );

    return {
        startCreateFlow,
        startImportFlow,
        startWatchOnlyFlow,
        startConnectLedgerFlow,
        startTestnetImportFlow,
        onMnemonicReady
    };
}
