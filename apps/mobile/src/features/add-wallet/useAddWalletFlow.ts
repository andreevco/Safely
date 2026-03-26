import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource, PortfolioMeta } from '@safely/core';
import {
    useGeneratePortfolio,
    useImportPortfolio,
    useUnlockableSecretEncryptorFactory
} from '@safely/ux';
import { useLoader } from '@safely/ux';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const createEncryptor = useUnlockableSecretEncryptorFactory();

    const startCreateFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate(routes.customize, {
                onSave: async (meta: PortfolioMeta) => {
                    using secretEncryptor = createEncryptor();
                    await secretEncryptor.unlockEncryption();

                    await withLoader(async () => {
                        await generatePortfolio({ meta, secretEncryptor });
                    });

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
    }, [navigation, generatePortfolio, withLoader]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        async (mnemonic: string[]) => {
            using secretEncryptor = createEncryptor();
            await secretEncryptor.unlockEncryption();

            await withLoader(async () => {
                using mnemonicAccessor = new MnemonicResource(mnemonic);
                const portfolio = await importPortfolio({ mnemonicAccessor, secretEncryptor });

                navigation.dispatch(
                    CommonActions.navigate(routes.customize, {
                        portfolio,
                        onCompleteCustomize: () => {
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'TabsNavigator' }]
                                })
                            );
                        }
                    })
                );
            });
        },
        [navigation, importPortfolio, withLoader, createEncryptor]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady
    };
}
