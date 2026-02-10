import { useSecurityCheck } from '@mobile/entities/security';
import { useLoader } from '@mobile/shared/providers/loader';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource, PortfolioMeta } from '@safely/core';
import { useChangePortfolioMeta, useGeneratePortfolio, useImportPortfolio } from '@safely/ux';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const { check } = useSecurityCheck();
    const { mutateAsync: importPortfolio } = useImportPortfolio();
    const { mutateAsync: generatePortfolio } = useGeneratePortfolio();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();

    const startCreateFlow = useCallback(async () => {
        const passed = await check();
        if (!passed) return;

        navigation.dispatch(CommonActions.navigate(routes.customize));
    }, [navigation, check]);

    const startImportFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate(routes.importWallet));
    }, [navigation]);

    const onMnemonicReady = useCallback(
        async (mnemonic: string[]) => {
            const passed = await check();
            if (!passed) return;

            await withLoader(async () => {
                using accessor = new MnemonicResource(mnemonic);
                await importPortfolio(accessor);
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        },
        [navigation, check, importPortfolio, withLoader]
    );

    const onFinishCustomize = useCallback(
        async (meta: PortfolioMeta) => {
            await withLoader(async () => {
                const portfolio = await generatePortfolio();

                await changePortfolioMeta({ portfolio, meta });
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        },
        [generatePortfolio, changePortfolioMeta, navigation, withLoader]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady,
        onFinishCustomize
    };
}
