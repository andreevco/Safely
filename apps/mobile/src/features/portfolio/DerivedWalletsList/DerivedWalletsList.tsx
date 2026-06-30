import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PortfolioLedger } from '@safely/core';
import { useActivePortfolio, useLedgerSession } from '@safely/ux';

import { Button, List } from '@mobile/shared/ui';

import { DerivedWalletRow } from './components/DerivedWalletRow';
import { styles } from './DerivedWalletsList.styles';

export const DerivedWalletsList = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { setFindMorePortfolioId } = useLedgerSession();

    const portfolio = useActivePortfolio() as PortfolioLedger;
    const derivations = portfolio.getDerivations();

    const handleFindMore = () => {
        setFindMorePortfolioId(portfolio.id.toString());
        navigation.navigate('AddWalletModal', { screen: 'ConnectLedgerModal' });
    };

    return (
        <View>
            <List.Title>{t('settings.groups.derivedWallets.title')}</List.Title>

            <List.Group variant="divided">
                {derivations.map(derivation => (
                    <DerivedWalletRow
                        key={derivation.index}
                        portfolio={portfolio}
                        derivation={derivation}
                    />
                ))}
            </List.Group>

            <View style={styles.findMore}>
                <Button type="secondary" size="small" onPress={handleFindMore}>
                    {t('derivedWallets.findMore')}
                </Button>
            </View>
        </View>
    );
};
