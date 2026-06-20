import { useNavigation } from '@react-navigation/core';
import { CommonActions, StackActions } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioLedger, PortfolioMeta } from '@safely/core';
import { PortfolioIdLedger, PortfolioNetworkType, PortfolioType } from '@safely/core';
import {
    useAddLedgerPortfolio,
    useLoader,
    useNewPortfolioFallbackName,
    usePortfolios,
    useSetActivePortfolio,
    useToast,
    useUpdateLedgerDerivations
} from '@safely/ux';

import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';
import { useLedgerAccounts, useLedgerSession } from '@mobile/features/ledger';
import { Button, List, Screen, Text } from '@mobile/shared/ui';

import { LedgerAccountCell } from './components';
import { styles } from './LedgerImportAccountsScreen.styles';

const SkeletonAccounts = new Array(10).fill(null);

export const LedgerImportAccountsScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const toast = useToast();
    const { mutateAsync: addLedgerPortfolio } = useAddLedgerPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const { mutateAsync: updateLedgerDerivations } = useUpdateLedgerDerivations();
    const defaultName = useNewPortfolioFallbackName();

    const { findMorePortfolioId, selectedDevice } = useLedgerSession();
    const portfolios = usePortfolios();

    const findMorePortfolio = useMemo(
        () =>
            findMorePortfolioId
                ? (portfolios.find(
                      p =>
                          p.id.toString() === findMorePortfolioId && p.type === PortfolioType.LEDGER
                  ) as PortfolioLedger | undefined)
                : undefined,
        [portfolios, findMorePortfolioId]
    );

    const lockedIndexes = useMemo(
        () => findMorePortfolio?.getDerivations().map(d => d.index),
        [findMorePortfolio]
    );

    const {
        accounts,
        balances,
        selectedIndexes,
        lockedIndexes: lockedSet,
        selectedAccounts,
        toggle,
        readMasterFingerprint,
        retry,
        isError,
        isTimedOut
    } = useLedgerAccounts({ lockedIndexes });

    const isDerived = accounts.length > 0;
    const showRetry = isError || isTimedOut;

    const handleContinue = useCallback(async () => {
        if (findMorePortfolio) {
            let masterFingerprint: string;
            try {
                masterFingerprint = await withLoader(() => readMasterFingerprint());
            } catch {
                return;
            }

            if (masterFingerprint !== findMorePortfolio.masterFingerprint) {
                toast(t('addWallet.connectLedger.importAccounts.wrongDevice'));
                return;
            }

            navigation.dispatch(
                CommonActions.navigate('CustomizeWalletModal', {
                    hasBackButton: true,
                    defaultName: findMorePortfolio.meta.name,
                    defaultIcon: findMorePortfolio.meta.icon,
                    title: t('customizeWallet.ledgerTitle'),
                    onSave: async (meta: PortfolioMeta) => {
                        await withLoader(() =>
                            updateLedgerDerivations({
                                portfolio: findMorePortfolio,
                                accounts: selectedAccounts,
                                meta
                            })
                        );

                        await setActivePortfolio({ id: findMorePortfolio.id });

                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    },
                    onClose: () => {
                        navigation.goBack();
                    }
                })
            );

            return;
        }

        let masterFingerprint: string;
        try {
            masterFingerprint = await withLoader(() => readMasterFingerprint());
        } catch {
            return;
        }

        const defaultIcon = new PortfolioIdLedger({
            masterFingerprint,
            networkType: PortfolioNetworkType.MAINNET
        }).getFallbackEmoji();

        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                defaultName,
                defaultIcon,
                title: t('customizeWallet.ledgerTitle'),
                onSave: async (meta: PortfolioMeta) => {
                    try {
                        await withLoader(() =>
                            addLedgerPortfolio({
                                masterFingerprint,
                                deviceModel: selectedDevice?.deviceModel.model ?? '',
                                accounts: selectedAccounts,
                                meta
                            })
                        );

                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    } catch (error) {
                        handleDuplicatePortfolio(error, navigation);
                    }
                },
                onClose: () => {
                    navigation.goBack();
                }
            })
        );
    }, [
        findMorePortfolio,
        withLoader,
        readMasterFingerprint,
        navigation,
        addLedgerPortfolio,
        updateLedgerDerivations,
        setActivePortfolio,
        selectedAccounts,
        selectedDevice,
        defaultName,
        toast,
        t
    ]);

    const handleRetry = useCallback(async () => {
        const recovered = await retry();

        if (!recovered) {
            navigation.dispatch(StackActions.popToTop());
        }
    }, [retry, navigation]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Scrollable style={styles.content}>
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.importAccounts.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.importAccounts.subtitle')}
                    </Text>
                </View>

                <List style={styles.list}>
                    <List.Group variant="divided">
                        {isDerived
                            ? accounts.map((account, i) => (
                                  <LedgerAccountCell
                                      key={account.index}
                                      account={account}
                                      balance={balances[i]}
                                      isSelected={selectedIndexes.has(account.index)}
                                      isLocked={lockedSet.has(account.index)}
                                      onPress={() =>
                                          lockedSet.has(account.index)
                                              ? toast(
                                                    t(
                                                        'addWallet.connectLedger.importAccounts.alreadyImported'
                                                    )
                                                )
                                              : toggle(account.index)
                                      }
                                  />
                              ))
                            : SkeletonAccounts.map((_, index) => (
                                  <LedgerAccountCell key={index} account={{ index }} isSkeleton />
                              ))}
                    </List.Group>
                </List>
                {isDerived && (
                    <Text
                        variant="bodyM"
                        color="tertiary"
                        textAlign="center"
                        style={styles.caption}
                    >
                        {t('addWallet.connectLedger.importAccounts.featureNote')}
                        <Text
                            variant="bodyM"
                            color="secondary"
                            onPress={() =>
                                toast(t('addWallet.connectLedger.importAccounts.featureRequested'))
                            }
                        >
                            {t('addWallet.connectLedger.importAccounts.featureRequest')}
                        </Text>
                    </Text>
                )}
            </Screen.Scrollable>
            <View style={styles.continueButton}>
                <Button
                    type={showRetry ? 'secondary' : 'primary'}
                    size="large"
                    onPress={showRetry ? handleRetry : handleContinue}
                    disabled={!showRetry && selectedIndexes.size === 0}
                >
                    {showRetry
                        ? t('addWallet.connectLedger.importAccounts.takingTooLong')
                        : t('common.continue')}
                </Button>
            </View>
        </Screen>
    );
};
