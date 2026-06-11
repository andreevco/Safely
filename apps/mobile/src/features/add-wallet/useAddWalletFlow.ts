import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';

import type { PortfolioMeta } from '@safely/core';
import { MnemonicResource } from '@safely/core';
import {
    useAppContext,
    useGeneratePortfolio,
    useImportPortfolio,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';

import { handleDuplicatePortfolio } from './handleDuplicatePortfolio';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const createEncryptor = useUnlockableSecretEncryptorFactory();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    const startCreateFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate(routes.customize, {
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
                onCompleteCustomize: () => {
                    navigation.goBack();
                }
            })
        );
    }, [navigation, generatePortfolio, getSecureEncrypted]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        (mnemonic: string[]) => {
            navigation.dispatch(
                CommonActions.navigate(routes.customize, {
                    onSave: async (meta: PortfolioMeta) => {
                        try {
                            using secretEncryptor = createEncryptor();
                            await secretEncryptor.unlockEncryption();

                            using mnemonicAccessor = new MnemonicResource(mnemonic);
                            await importPortfolio({ mnemonicAccessor, secretEncryptor, meta });

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
                    onCompleteCustomize: () => {
                        navigation.goBack();
                    }
                })
            );
        },
        [navigation, importPortfolio, createEncryptor]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady
    };
}
