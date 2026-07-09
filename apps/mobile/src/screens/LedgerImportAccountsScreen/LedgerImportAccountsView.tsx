import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { BtcAssetAmount, LedgerAccount } from '@safely/core';
import { useToast } from '@safely/ux';

import { ArrowLeft16, Button, Icon, List, Screen, Text } from '@mobile/shared/ui';

import { LedgerAccountCell } from './components';
import { styles } from './LedgerImportAccountsScreen.styles';

const SkeletonAccounts = new Array(10).fill(null);

type LedgerImportAccountsViewProps = {
    accounts: LedgerAccount[];
    balances: (BtcAssetAmount | undefined)[];
    selectedIndexes: Set<number>;
    existingNames?: Map<number, string>;
    isDerived: boolean;
    showRetry: boolean;
    isContinueDisabled: boolean;
    onToggle: (index: number) => void;
    onPrimary: () => void;
    onBack: () => void;
};

export const LedgerImportAccountsView = (props: LedgerImportAccountsViewProps) => {
    const {
        accounts,
        balances,
        selectedIndexes,
        existingNames,
        isDerived,
        showRetry,
        isContinueDisabled,
        onToggle,
        onPrimary,
        onBack
    } = props;

    const { t } = useTranslation();
    const toast = useToast();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Button onPress={onBack}>
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
                                      name={existingNames?.get(account.index)}
                                      onPress={() => onToggle(account.index)}
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
                    onPress={onPrimary}
                    disabled={isContinueDisabled}
                >
                    {showRetry
                        ? t('addWallet.connectLedger.importAccounts.takingTooLong')
                        : t('common.continue')}
                </Button>
            </View>
        </Screen>
    );
};
