import { useActivePortfolio, useIsActiveWalletWatchOnly } from '@safely/ux';

export function useRemoveWalletState() {
    const isWatchOnly = useIsActiveWalletWatchOnly();
    const portfolio = useActivePortfolio();
    const isSeedRevealed = portfolio.secretRevealedStatus !== null;

    if (isWatchOnly) {
        return {
            subtitleKey: 'removeWallet.watchOnly.subtitle',
            hasCheckbox: false,
            hasBackUpLink: false
        } as const;
    }

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
