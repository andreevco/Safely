import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback } from 'react';

import type { PortfolioNetworkType } from '@safely/core';

import { SeedPhraseImportForm, useAddWalletFlow } from '@mobile/features/add-wallet';

type ImportWalletScreenProps = StaticScreenProps<{ networkType: PortfolioNetworkType }>;

export const ImportWalletScreen = (props: ImportWalletScreenProps) => {
    const networkType = props.route.params.networkType;
    const { onMnemonicReady } = useAddWalletFlow();

    const handleMnemonicReady = useCallback(
        (mnemonic: string[]) => {
            void onMnemonicReady(mnemonic, networkType);
        },
        [onMnemonicReady, networkType]
    );

    return <SeedPhraseImportForm onMnemonicReady={handleMnemonicReady} />;
};
