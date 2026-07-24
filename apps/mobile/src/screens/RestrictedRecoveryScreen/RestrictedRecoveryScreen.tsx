import { useNavigation } from '@react-navigation/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';
import { useAccounts, usePortfolios, useSetActivePortfolio } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { Icon, ListKey96 } from '@mobile/shared/ui/Icon';

import { styles } from './RestrictedRecoveryScreen.styles';
import { AccountSelector } from '../SettingsScreen/components/AccountSection/AccountSelector';

export const RestrictedRecoveryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const handleLogOut = useLogOutAllConfirmation();

    const accounts = useAccounts();
    const portfolios = usePortfolios();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    const recoverablePortfolios = useMemo(
        () => portfolios.filter(portfolio => portfolio.type === PortfolioType.BIP39),
        [portfolios]
    );

    const hasMultipleAccounts = (accounts?.length ?? 0) > 1;

    const handleSelectWallet = async (portfolio: Portfolio) => {
        await setActivePortfolio({ id: portfolio.id });
        navigation.navigate('RecoveryConfirmSheet');
    };

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title />
                <Screen.Header.Button type="small" onPress={handleLogOut}>
                    <Text variant="labelM" color="primary">
                        {t('passcode.lockout.signOut')}
                    </Text>
                </Screen.Header.Button>
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
                        {hasMultipleAccounts && (
                            <List.Title>{t('restrictedRecovery.wallets')}</List.Title>
                        )}
                        <List.Group
                            variant="separated"
                            style={!hasMultipleAccounts && styles.listWithoutTitle}
                        >
                            {[
                                ...recoverablePortfolios,
                                ...recoverablePortfolios,
                                ...recoverablePortfolios,
                                ...recoverablePortfolios,
                                ...recoverablePortfolios
                            ].map(portfolio => (
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
            </Screen.Scrollable>
        </Screen>
    );
};
