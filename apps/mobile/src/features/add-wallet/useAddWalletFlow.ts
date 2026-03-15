import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource, PortfolioMeta } from '@safely/core';
import {
    useGeneratePortfolio,
    useImportPortfolio,
    useRecordSeedReveal,
    useSecurityCheck
} from '@safely/ux';

import { useLoader } from '@mobile/shared/providers/loader';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: recordSeedReveal } = useRecordSeedReveal();
    const check = useSecurityCheck();

    const startCreateFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate(routes.customize, {
                onSave: async (meta: PortfolioMeta) => {
                    await withLoader(async () => {
                        await generatePortfolio(meta);
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
            await check();
            await withLoader(async () => {
                using accessor = new MnemonicResource(mnemonic);
                const portfolio = await importPortfolio(accessor);
                recordSeedReveal().catch(console.error);

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
        [navigation, importPortfolio, recordSeedReveal, withLoader, check]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady
    };
}
