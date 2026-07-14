import type { Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';

export function useRemoveWalletState(portfolio: Portfolio, isLedgerDevice: boolean) {
    if (portfolio.type === PortfolioType.LEDGER && isLedgerDevice) {
        return {
            titleKey: 'removeWallet.disconnectLedger.title',
            subtitleKey: 'removeWallet.disconnectLedger.subtitle',
            checkboxKey: 'removeWallet.disconnectLedger.checkbox',
            buttonKey: 'removeWallet.disconnectLedger.button',
            hasCheckbox: true,
            hasBackUpLink: false
        } as const;
    }

    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        return {
            titleKey: 'removeWallet.title',
            subtitleKey: 'removeWallet.watchOnly.subtitle',
            buttonKey: 'removeWallet.removeButton',
            hasCheckbox: false,
            hasBackUpLink: false
        } as const;
    }

    if (portfolio.type === PortfolioType.LEDGER) {
        return {
            titleKey: 'removeWallet.hideDerivation.title',
            subtitleKey: 'removeWallet.hideDerivation.subtitle',
            buttonKey: 'removeWallet.hideDerivation.button',
            hasCheckbox: false,
            hasBackUpLink: false
        } as const;
    }

    const isSeedRevealed = portfolio.secretRevealedStatus !== null;

    if (isSeedRevealed) {
        return {
            titleKey: 'removeWallet.title',
            subtitleKey: 'removeWallet.revealed.subtitle',
            checkboxKey: 'removeWallet.revealed.checkbox',
            buttonKey: 'removeWallet.removeButton',
            hasCheckbox: true,
            hasBackUpLink: true
        } as const;
    }

    return {
        titleKey: 'removeWallet.title',
        subtitleKey: 'removeWallet.notRevealed.subtitle',
        checkboxKey: 'removeWallet.notRevealed.checkbox',
        buttonKey: 'removeWallet.removeButton',
        hasCheckbox: true,
        hasBackUpLink: true
    } as const;
}
