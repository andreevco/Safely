import { PortfolioType } from '@safely/core';
import { useActivePortfolio, useIsActiveWalletWatchOnly } from '@safely/ux';

export function useRemoveWalletState() {
    const isWatchOnly = useIsActiveWalletWatchOnly();
    const portfolio = useActivePortfolio();

    if (isWatchOnly) {
        return {
            subtitleKey: 'removeWallet.watchOnly.subtitle',
            hasCheckbox: false,
            hasBackUpLink: false
        } as const;
    }

    const isSeedRevealed =
        portfolio.type === PortfolioType.BIP39 && portfolio.secretRevealedStatus !== null;

    if (isSeedRevealed) {
        return {
            subtitleKey: 'removeWallet.revealed.subtitle',
            checkboxKey: 'removeWallet.revealed.checkbox',
            hasCheckbox: true,
            hasBackUpLink: true
        } as const;
    }

    return {
        subtitleKey: 'removeWallet.notRevealed.subtitle',
        checkboxKey: 'removeWallet.notRevealed.checkbox',
        hasCheckbox: true,
        hasBackUpLink: true
    } as const;
}
