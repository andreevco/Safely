import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource, Portfolio, PortfolioMeta } from '@safely/core';
import {
    useActivePortfolio,
    useChangePortfolioMeta,
    useGeneratePortfolio,
    useImportPortfolio
} from '@safely/ux';

import { useSecurityCheck } from '@mobile/entities/security';
import { useLoader } from '@mobile/shared/providers/loader';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const check = useSecurityCheck();
    const activePortfolio = useActivePortfolio();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();

    const startCreateFlow = useCallback(async () => {
        await check();
        navigation.dispatch(
            CommonActions.navigate(routes.customize, {
                onSuccess: () => {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'TabsNavigator' }]
                        })
                    );
                }
            })
        );
    }, [navigation, check]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        async (mnemonic: string[]) => {
            await check();
            await withLoader(async () => {
                using accessor = new MnemonicResource(mnemonic);
                await importPortfolio(accessor);
            });

            navigation.dispatch(
                CommonActions.navigate(routes.customize, {
                    portfolio: activePortfolio,
                    onSuccess: () => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    }
                })
            );
        },
        [navigation, check, importPortfolio, withLoader]
    );

    const onFinishCustomize = useCallback(
        async (meta: PortfolioMeta, portfolio?: Portfolio, onSuccess?: () => void) => {
            await withLoader(async () => {
                if (portfolio) {
                    await changePortfolioMeta({ portfolio, meta });
                } else {
                    const generatedPortfolio = await generatePortfolio();
                    await changePortfolioMeta({ portfolio: generatedPortfolio, meta });
                }
            });

            onSuccess?.();
        },
        [activePortfolio, generatePortfolio, changePortfolioMeta, navigation, withLoader]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady,
        onFinishCustomize
    };
}
