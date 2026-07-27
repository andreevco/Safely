import { useNavigation } from '@react-navigation/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';
import { useAccounts, usePortfolios, useSetActivePortfolio, useToast } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { Icon, ListKey96 } from '@mobile/shared/ui/Icon';

import { styles } from './RestrictedRecoveryScreen.styles';
import { AccountSelector } from '../SettingsScreen/components/AccountSection/AccountSelector';

export const RestrictedRecoveryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const toast = useToast();
    const accounts = useAccounts();
    const portfolios = usePortfolios();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    const recoverablePortfolios = useMemo(
        () => portfolios.filter(portfolio => portfolio.type === PortfolioType.BIP39),
        [portfolios]
    );
    const nonRecoverablePortfolios = useMemo(
        () => portfolios.filter(portfolio => portfolio.type !== PortfolioType.BIP39),
        [portfolios]
    );

    const hasMultipleAccounts = (accounts?.length ?? 0) > 1;
    const showWalletsTitle = hasMultipleAccounts || nonRecoverablePortfolios.length > 0;

    const handleSelectWallet = async (portfolio: Portfolio) => {
        await setActivePortfolio({ id: portfolio.id });
        navigation.navigate('RecoveryConfirmSheet');
    };

    const handleNoRecoveryPhrase = () => {
        toast({ message: t('restrictedRecovery.noRecoveryPhrase') });
    };

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
                <Screen.Header.Title />
            </Screen.Header>

            <Screen.Scrollable contentContainerStyle={styles.content}>
                <Icon icon={ListKey96} style={styles.icon} />
                <View style={styles.recoveryText}>
                    <Text variant="titleM" textAlign="center">
                        {t('restrictedRecovery.title')}
                    </Text>
                    <Text variant="bodyL" color="secondary" textAlign="center">
                        {t('restrictedRecovery.subtitle')}
                    </Text>
                </View>

                {hasMultipleAccounts && (
                    <AccountSelector
                        accounts={accounts ?? []}
                        onSelectAccountNavigate={() =>
                            navigation.navigate('SelectAccountSelectorModal')
                        }
                    />
                )}

                {recoverablePortfolios.length > 0 && (
                    <View>
                        {showWalletsTitle && (
                            <List.Title>{t('restrictedRecovery.wallets')}</List.Title>
                        )}
                        <List.Group
                            variant="separated"
                            style={!showWalletsTitle && styles.listWithoutTitle}
                        >
                            {recoverablePortfolios.map(portfolio => (
                                <Cell
                                    key={portfolio.id.toString()}
                                    onPress={() => handleSelectWallet(portfolio)}
                                >
                                    <Cell.Content>
                                        <Cell.Row>
                                            <PortfolioName
                                                meta={portfolio.meta}
                                                gap={12}
                                                size={16}
                                                type={portfolio.type}
                                                networkType={portfolio.networkType}
                                            />
                                        </Cell.Row>
                                    </Cell.Content>
                                    <Cell.Chevron />
                                </Cell>
                            ))}
                        </List.Group>
                    </View>
                )}

                {nonRecoverablePortfolios.length > 0 && (
                    <View>
                        <List.Title>{t('restrictedRecovery.withoutRecoveryPhrase')}</List.Title>
                        <List.Group variant="separated">
                            {nonRecoverablePortfolios.map(portfolio => (
                                <Cell
                                    key={portfolio.id.toString()}
                                    onPress={handleNoRecoveryPhrase}
                                >
                                    <Cell.Content>
                                        <Cell.Row>
                                            <View style={styles.nonRecoverableName}>
                                                <PortfolioName
                                                    meta={portfolio.meta}
                                                    gap={12}
                                                    size={16}
                                                    type={portfolio.type}
                                                    networkType={portfolio.networkType}
                                                />
                                                {portfolio.type === PortfolioType.LEDGER && (
                                                    <Text variant="bodyM" color="tertiary">
                                                        {`· ${t('settings.walletsCount', {
                                                            count: portfolio.getDerivations().length
                                                        })}`}
                                                    </Text>
                                                )}
                                            </View>
                                        </Cell.Row>
                                    </Cell.Content>
                                </Cell>
                            ))}
                        </List.Group>
                    </View>
                )}
            </Screen.Scrollable>
        </Screen>
    );
};
