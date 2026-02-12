import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { MnemonicResource, PortfolioMeta } from '@safely/core';
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
        navigation.dispatch(CommonActions.navigate(routes.customize, { isImport: false }));
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
                    isImport: true
                })
            );
        },
        [navigation, check, importPortfolio, withLoader]
    );

    const onFinishCustomize = useCallback(
        async (meta: PortfolioMeta, isImport: boolean) => {
            await withLoader(async () => {
                if (isImport) {
                    await changePortfolioMeta({ portfolio: activePortfolio, meta });
                } else {
                    const portfolio = await generatePortfolio();
                    await changePortfolioMeta({ portfolio, meta });
                }
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
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
