import { useNavigation } from '@react-navigation/core';
import { CommonActions, StackActions } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioLedger, PortfolioMeta } from '@safely/core';
import { PortfolioIdLedger, PortfolioNetworkType, PortfolioType } from '@safely/core';
import {
    useAddLedgerPortfolio,
    useLedgerAccounts,
    useLedgerSession,
    useLoader,
    useNewPortfolioFallbackName,
    usePortfolios,
    useSecurityCheck,
    useSetActivePortfolio,
    useToast,
    useUpdateLedgerDerivations
} from '@safely/ux';

import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';
import { useExitToConnectLedger } from '@mobile/features/ledger';
import { ArrowLeft16, Button, Icon, List, Screen, Text } from '@mobile/shared/ui';

import { LedgerAccountCell } from './components';
import { styles } from './LedgerImportAccountsScreen.styles';

const SkeletonAccounts = new Array(10).fill(null);

export const LedgerImportAccountsScreen = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const check = useSecurityCheck();
    const { mutateAsync: addLedgerPortfolio } = useAddLedgerPortfolio();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const { mutateAsync: updateLedgerDerivations } = useUpdateLedgerDerivations();
    const defaultName = useNewPortfolioFallbackName();

    const { findMorePortfolioId, selectedDevice } = useLedgerSession();
    const exitToConnect = useExitToConnectLedger();
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

    const {
        accounts,
        balances,
        masterFingerprint,
        existingPortfolio,
        selectedIndexes,
        selectedAccounts,
        toggle,
        retry,
        isError,
        isTimedOut
    } = useLedgerAccounts();

    const targetPortfolio = findMorePortfolio ?? existingPortfolio;

    const existingNames = useMemo(
        () => new Map(targetPortfolio?.getDerivations().map(d => [d.index, d.meta.name]) ?? []),
        [targetPortfolio]
    );

    const isDerived = accounts.length > 0;
    const showRetry = isError || isTimedOut;

    const handleContinue = useCallback(() => {
        if (!masterFingerprint) {
            return;
        }

        if (targetPortfolio) {
            if (
                findMorePortfolio &&
                !masterFingerprint.equals(findMorePortfolio.masterFingerprint)
            ) {
                toast(t('addWallet.connectLedger.importAccounts.wrongDevice'));
                return;
            }

            navigation.dispatch(
                CommonActions.navigate('CustomizeWalletModal', {
                    hasBackButton: true,
                    defaultName: targetPortfolio.meta.name,
                    defaultIcon: targetPortfolio.meta.icon,
                    title: t('customizeWallet.ledgerTitle'),
                    onSave: async (meta: PortfolioMeta) => {
                        await check();

                        await withLoader(() =>
                            updateLedgerDerivations({
                                portfolio: targetPortfolio,
                                accounts: selectedAccounts,
                                meta
                            })
                        );

                        await setActivePortfolio({ id: targetPortfolio.id });

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

        const defaultIcon = new PortfolioIdLedger({
            masterFingerprint: masterFingerprint.toString('hex'),
            networkType: PortfolioNetworkType.MAINNET
        }).getFallbackEmoji();

        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                defaultName,
                defaultIcon,
                title: t('customizeWallet.ledgerTitle'),
                onSave: async (meta: PortfolioMeta) => {
                    await check();

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
        targetPortfolio,
        withLoader,
        check,
        masterFingerprint,
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
                <Screen.Header.Button onPress={exitToConnect}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
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
                                      name={existingNames.get(account.index)}
                                      onPress={() => toggle(account.index)}
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
                    disabled={!showRetry && (!isDerived || selectedIndexes.size === 0)}
                >
                    {showRetry
                        ? t('addWallet.connectLedger.importAccounts.takingTooLong')
                        : t('common.continue')}
                </Button>
            </View>
        </Screen>
    );
};
