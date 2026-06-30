import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio, useChangePortfolioMeta } from '@safely/ux';

import { DerivedWalletsList } from '@mobile/features/portfolio/DerivedWalletsList';
import { RemovePortfolioButton } from '@mobile/screens/SettingsScreen/components';
import { Cell, List } from '@mobile/shared/ui';

export const LedgerWalletSettings = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const portfolio = useActivePortfolio();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();

    const handleEditLedger = () => {
        navigation.navigate('CustomizeWalletModal', {
            hasBackButton: true,
            title: t('customizeWallet.ledgerTitle'),
            defaultName: portfolio.meta.name,
            defaultIcon: portfolio.meta.icon,
            onSave: async meta => {
                await changePortfolioMeta({ portfolio, meta });
                navigation.getParent()?.goBack();
            },
            onClose: () => navigation.getParent()?.goBack()
        });
    };

    return (
        <List>
            <List.Group variant="separated">
                <Cell onPress={handleEditLedger}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('settings.groups.currentWallet.options.editLedger')}
                            </Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
            </List.Group>

            <DerivedWalletsList />

            <List.Group variant="separated">
                <RemovePortfolioButton />
            </List.Group>
        </List>
    );
};
