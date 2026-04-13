import { PortfolioType } from '@safely/core';
import { useActivePortfolio } from '@safely/ux';

export function useRemoveWalletState() {
    const portfolio = useActivePortfolio();

    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        return {
            subtitleKey: 'removeWallet.watchOnly.subtitle',
            hasCheckbox: false,
            hasBackUpLink: false
        } as const;
    }

    const isSeedRevealed = portfolio.secretRevealedStatus !== null;

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
