import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource } from '@safely/core';
import { useGeneratePortfolio, useImportPortfolio, useSecurityCheck } from '@safely/ux';

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
    const check = useSecurityCheck();

    const startCreateFlow = useCallback(async () => {
        await withLoader(async () => {
            const portfolio = await generatePortfolio();

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
    }, [navigation, check]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        async (mnemonic: string[]) => {
            await check();
            await withLoader(async () => {
                using accessor = new MnemonicResource(mnemonic);
                const portfolio = await importPortfolio(accessor);

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
        [navigation, importPortfolio, withLoader, check]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady
    };
}
