import { useNavigation } from '@react-navigation/core';
import { CommonActions, StackActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioMeta } from '@safely/core';
import { useAddLedgerPortfolio, useLoader, useToast } from '@safely/ux';

import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';
import { useLedgerAccounts } from '@mobile/features/ledger';
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
    const {
        accounts,
        balances,
        selectedIndexes,
        selectedAccounts,
        toggle,
        readMasterFingerprint,
        retry,
        isError,
        isTimedOut
    } = useLedgerAccounts();

    const isDerived = accounts.length > 0;
    const showRetry = isError || isTimedOut;

    const handleContinue = useCallback(async () => {
        let masterFingerprint: string;
        try {
            masterFingerprint = await withLoader(() => readMasterFingerprint());
        } catch {
            return;
        }

        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                onSave: async (meta: PortfolioMeta) => {
                    try {
                        await withLoader(() =>
                            addLedgerPortfolio({
                                masterFingerprint,
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
                onCompleteCustomize: () => {
                    navigation.goBack();
                }
            })
        );
    }, [withLoader, readMasterFingerprint, navigation, addLedgerPortfolio, selectedAccounts]);

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
