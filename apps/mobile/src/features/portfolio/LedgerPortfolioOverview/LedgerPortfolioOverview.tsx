import { useNavigation } from '@react-navigation/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioLedger } from '@safely/core';
import {
    useActivePortfolio,
    useBtcWalletBalances,
    useBtcWalletsFiatBalance,
    useNumberFormatter
} from '@safely/ux';

import { useLedgerSession } from '@mobile/features/ledger';
import { Button, List, Text } from '@mobile/shared/ui';

import { LedgerOverviewRow } from './components/LedgerOverviewRow';
import { styles } from './LedgerPortfolioOverview.styles';

export const LedgerPortfolioOverview = () => {
    const { t } = useTranslation();
    const { setFindMorePortfolioId } = useLedgerSession();
    const formatter = useNumberFormatter();
    const navigation = useNavigation();

    const portfolio = useActivePortfolio() as PortfolioLedger;
    const derivations = portfolio.getDerivations();

    const wallets = useMemo(
        () => derivations.map(derivation => derivation.chains.btc.wallets[0]),
        [derivations]
    );

    const balances = useBtcWalletBalances(wallets);
    const totalBalance = useBtcWalletsFiatBalance(wallets);

    const handleFindMore = () => {
        setFindMorePortfolioId(portfolio.id.toString());
        navigation.navigate('AddWalletModal', { screen: 'ConnectLedgerModal' });
    };

    return (
        <View>
            <View style={styles.balance}>
                <Text textAlign="center" variant="displayL" skeleton>
                    {totalBalance.data?.format(formatter)}
                </Text>
                {derivations.length > 0 && (
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('settings.walletsCount', { count: derivations.length })}
                    </Text>
                )}
            </View>

            <List style={styles.list}>
                <List.Group variant="divided">
                    {derivations.map((derivation, index) => (
                        <LedgerOverviewRow
                            key={derivation.index}
                            portfolio={portfolio}
                            derivation={derivation}
                            balance={balances[index]?.display}
                        />
                    ))}
                </List.Group>
            </List>

            <View style={styles.findMore}>
                <Button type="secondary" size="small" onPress={handleFindMore}>
                    {t('ledgerOverview.findMore')}
                </Button>
            </View>
        </View>
    );
};
