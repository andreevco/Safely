import { useNavigation } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    useLedgerAccounts,
    useLedgerAccountSelection,
    useLedgerSession,
    useLedgerWalletName
} from '@safely/ux';

import { useExitToConnectLedger } from '@mobile/features/ledger';
import { useOnboardingFlow } from '@mobile/features/onboarding';
import { LedgerImportAccountsView } from '@mobile/screens/LedgerImportAccountsScreen/LedgerImportAccountsView';

export const OnboardingLedgerImportScreen = () => {
    const { t } = useTranslation();
    const exitToConnect = useExitToConnectLedger();
    const navigation = useNavigation();
    const { selectedDevice } = useLedgerSession();
    const { onLedgerReady } = useOnboardingFlow();
    const walletName = useLedgerWalletName(selectedDevice?.deviceModel.model);

    const { accounts, balances, masterFingerprint, retry, isError, isTimedOut } =
        useLedgerAccounts();

    const { selectedIndexes, selectedAccounts, toggle } = useLedgerAccountSelection({
        accounts,
        balances
    });

    const isDerived = accounts.length > 0;
    const showRetry = isError || isTimedOut;

    const handleContinue = useCallback(() => {
        if (!masterFingerprint) {
            return;
        }

        const accountsWithNames = selectedAccounts.map(account => ({
            ...account,
            name: t('portfolio.ledgerWallet', { number: account.index + 1 })
        }));

        onLedgerReady(
            masterFingerprint.toString('hex'),
            selectedDevice?.deviceModel.model ?? '',
            walletName,
            accountsWithNames
        );
    }, [masterFingerprint, selectedAccounts, selectedDevice, walletName, onLedgerReady, t]);

    const handleRetry = useCallback(async () => {
        const recovered = await retry();

        if (!recovered) {
            navigation.dispatch(StackActions.popToTop());
        }
    }, [retry, navigation]);

    return (
        <LedgerImportAccountsView
            accounts={accounts}
            balances={balances}
            selectedIndexes={selectedIndexes}
            isDerived={isDerived}
            showRetry={showRetry}
            isContinueDisabled={!showRetry && (!isDerived || selectedIndexes.size === 0)}
            onToggle={toggle}
            onPrimary={showRetry ? handleRetry : handleContinue}
            onBack={exitToConnect}
        />
    );
};
