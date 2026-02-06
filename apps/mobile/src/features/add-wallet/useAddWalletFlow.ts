import { useSecurityCheck } from '@mobile/entities/security';
import { useCreatePortfolio } from '@mobile/features/onboarding';
import { useLoader } from '@mobile/shared/providers/loader';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { PortfolioMeta } from '@safely/core';
import { generateBip39Accessor } from '@safely/core/entities/seed';

const routes = {
    importWallet: 'ImportWalletModal',
    customize: 'CustomizeWalletModal'
} as const;

export function useAddWalletFlow() {
    const navigation = useNavigation();
    const createPortfolio = useCreatePortfolio();
    const { withLoader } = useLoader();
    const { check } = useSecurityCheck();

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

            const defaultMeta = {
                name: 'Wallet 1',
                icon: { type: 'emoji' as const, value: '🙂' }
            };

            await withLoader(() => createPortfolio(mnemonic, defaultMeta));

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        },
        [navigation, check, createPortfolio, withLoader]
    );

    const onFinishCustomize = useCallback(
        async (meta: PortfolioMeta) => {
            await withLoader(async () => {
                using accessor = generateBip39Accessor();
                const mnemonic = [...accessor.value];

                await createPortfolio(mnemonic, meta);
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                })
            );
        },
        [createPortfolio, navigation, withLoader]
    );

    return {
        startCreateFlow,
        startImportFlow,
        onMnemonicReady,
        onFinishCustomize
    };
}
