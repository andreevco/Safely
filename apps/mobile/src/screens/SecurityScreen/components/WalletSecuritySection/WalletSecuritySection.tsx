import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { PortfolioType } from '@safely/core';
import { useActivePortfolio, useDateFormatter } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, List, Text } from '@mobile/shared/ui';
import { Icon, Switch16 } from '@mobile/shared/ui/Icon';

import { styles } from '../../SecurityScreen.styles';

export const WalletSecuritySection = () => {
    const { t } = useTranslation();
    const portfolio = useActivePortfolio();
    const isWatchOnly = portfolio.type === PortfolioType.WATCH_ONLY;
    const secretRevealedStatus =
        portfolio.type === PortfolioType.BIP39 ? portfolio.secretRevealedStatus : null;
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const formatDate = useDateFormatter({
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

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
                            <PortfolioName meta={portfolio.meta} isWatchOnly={isWatchOnly} />
                        </Cell.Row>
                    </Cell.Content>
                    <Icon icon={Switch16} color="tertiary" />
                </Cell>
            </List.Group>
            {isWatchOnly ? (
                <Text variant="bodyM" color="tertiary" style={styles.watchInfoText}>
                    {t('addWallet.watchAccount.info')}
                </Text>
            ) : (
                <List.Group>
                    <Cell onPress={handleRecoveryPress}>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>
                                    {t('security.groups.wallet.recovery.title')}
                                </Cell.Title>
                            </Cell.Row>
                            <Cell.Row>
                                <Cell.Subtitle numberOfLines={0}>
                                    {secretRevealedStatus
                                        ? t('security.groups.wallet.recovery.revealed', {
                                              date: formatDate.format(
                                                  secretRevealedStatus.revealedAt
                                              ),
                                              device: secretRevealedStatus.revealedFromDevice
                                          })
                                        : t('security.groups.wallet.recovery.subtitle')}
                                </Cell.Subtitle>
                            </Cell.Row>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                </List.Group>
            )}
        </List>
    );
};
