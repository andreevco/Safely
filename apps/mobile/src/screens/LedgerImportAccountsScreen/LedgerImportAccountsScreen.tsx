import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLedgerAccounts } from '@mobile/features/ledger';
import { Button, CircularSpinner, List, Screen, Text } from '@mobile/shared/ui';

import { LedgerAccountCell } from './components';
import { styles } from './LedgerImportAccountsScreen.styles';

export const LedgerImportAccountsScreen = () => {
    const { t } = useTranslation();
    const { accounts, selectedIndexes, toggle, showNext, isLoading, isLoadingMore } =
        useLedgerAccounts();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.importAccounts.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.importAccounts.subtitle')}
                    </Text>
                </View>

                {isLoading ? (
                    <View style={styles.statusContainer}>
                        <CircularSpinner />
                    </View>
                ) : (
                    <>
                        <List style={styles.list}>
                            <List.Group variant="divided">
                                {accounts.map(account => (
                                    <LedgerAccountCell
                                        key={account.index}
                                        account={account}
                                        isSelected={selectedIndexes.has(account.index)}
                                        onPress={() => toggle(account.index)}
                                    />
                                ))}
                            </List.Group>
                        </List>

                        <Button
                            size="small"
                            type="secondary"
                            style={styles.showNext}
                            isLoading={isLoadingMore}
                            onPress={showNext}
                        >
                            {t('addWallet.connectLedger.importAccounts.showNext')}
                        </Button>
                    </>
                )}
            </Screen.Content>
        </Screen>
    );
};
