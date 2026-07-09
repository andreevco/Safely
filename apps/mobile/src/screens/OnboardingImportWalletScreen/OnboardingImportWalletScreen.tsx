import { useCallback } from 'react';

import { PortfolioNetworkType } from '@safely/core';

import { SeedPhraseImportForm } from '@mobile/features/add-wallet';
import { useOnboardingFlow } from '@mobile/features/onboarding';

export const OnboardingImportWalletScreen = () => {
    const { onMnemonicReady } = useOnboardingFlow();

    const handleMnemonicReady = useCallback(
        (mnemonic: string[]) => {
            onMnemonicReady(mnemonic, PortfolioNetworkType.MAINNET);
        },
        [onMnemonicReady]
    );

    return <SeedPhraseImportForm onMnemonicReady={handleMnemonicReady} />;
};
