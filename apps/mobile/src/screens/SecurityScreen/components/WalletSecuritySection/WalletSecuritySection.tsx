import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, List } from '@mobile/shared/ui';
import { Icon, Switch16 } from '@mobile/shared/ui/Icon';

import { styles } from '../../SecurityScreen.styles';

export const WalletSecuritySection = () => {
    const { t } = useTranslation();
    const portfolio = useActivePortfolio();
    const rootNavigation = useNavigation<RootStackNavigationProp>();

    const handleSelectWallet = () => {
        rootNavigation.navigate('SelectAccountModal');
    };

    const handleRecoveryPress = () => {
        rootNavigation.navigate('RecoveryConfirmSheet');
    };

    return (
        <List>
            <List.Title>{t('security.groups.wallet.title')}</List.Title>
            <List.Group style={styles.listGroupMargin}>
                <Cell onPress={handleSelectWallet}>
                    <Cell.Content>
                        <Cell.Row>
                            <PortfolioName meta={portfolio.meta} />
                        </Cell.Row>
                    </Cell.Content>
                    <Icon icon={Switch16} color="tertiary" />
                </Cell>
            </List.Group>
            <List.Group>
                <Cell onPress={handleRecoveryPress}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('security.groups.wallet.recovery.title')}</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle numberOfLines={0}>
                                {t('security.groups.wallet.recovery.subtitle')}
                            </Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
            </List.Group>
        </List>
    );
};
