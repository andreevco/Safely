import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';

import type { PortfolioMeta } from '@safely/core';
import { PortfolioIdBip39Imported } from '@safely/core';
import { PortfolioIdBip39MasterKeyDerived } from '@safely/core';
import { MnemonicResource } from '@safely/core';
import {
    useActiveAccountStoreSlot,
    useAppContext,
    useGeneratePortfolio,
    useImportPortfolio,
    useNewPortfolioFallbackName,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';
import { useLoader } from '@safely/ux';

import { handleDuplicatePortfolio } from './handleDuplicatePortfolio';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { withLoader } = useLoader();
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
        let defaultIcon;
        if (nextGeneratingPortfolioInfo?.emoji) {
            defaultIcon = { type: 'emoji', value: nextGeneratingPortfolioInfo.emoji };
        } else {
            defaultIcon = PortfolioIdBip39MasterKeyDerived.getFallbackEmoji(
                nextGeneratingPortfolioInfo?.index ?? 0
            );
        }

        navigation.dispatch(
            CommonActions.navigate(routes.customize, {
                defaultIcon,
                defaultName,
                onSave: async (meta: PortfolioMeta) => {
                    using secureEncryptedStorage = getSecureEncrypted();
                    await secureEncryptedStorage.unlock();

                    await withLoader(async () => {
                        await generatePortfolio({ meta, secureEncryptedStorage });
                    });

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
            })
        );
    }, [
        navigation,
        generatePortfolio,
        withLoader,
        getSecureEncrypted,
        nextGeneratingPortfolioInfo,
        defaultName
    ]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[]) => {
            using accessor = new MnemonicResource(mnemonic);
            const defaultIcon = PortfolioIdBip39Imported.getFallbackEmoji(accessor);

            navigation.dispatch(
                CommonActions.navigate(routes.customize, {
                    defaultIcon,
                    defaultName,
                    onSave: async (meta: PortfolioMeta) => {
                        try {
                            using secretEncryptor = createEncryptor();
                            await secretEncryptor.unlockEncryption();

                            await withLoader(async () => {
                                using mnemonicAccessor = new MnemonicResource(mnemonic);
                                await importPortfolio({ mnemonicAccessor, secretEncryptor, meta });
                            });

                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'TabsNavigator' }]
                                })
                            );
                        } catch (error) {
                            handleDuplicatePortfolio(error, navigation);
                        }
                    },
                    onClose: () => {
                        navigation.goBack();
                    }
                })
            );
        },
        [navigation, importPortfolio, withLoader, createEncryptor, defaultName]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady
    };
}
