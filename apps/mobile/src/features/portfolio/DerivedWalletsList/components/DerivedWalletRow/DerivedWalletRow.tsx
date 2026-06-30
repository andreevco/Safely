import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ellipsisMiddle, type ILedgerDerivation, type PortfolioLedger } from '@safely/core';
import {
    isDerivableEntities,
    useActivePortfolioEntities,
    useBtcBalance,
    useFormattedAmount,
    useToast,
    useUpdateDerivationMeta
} from '@safely/ux';

import { LedgerDerivationRow } from '@mobile/features/ledger';
import { Badge, Button, Icon, Pencil16, Text } from '@mobile/shared/ui';

import { styles } from './DerivedWalletRow.styles';

type DerivedWalletRowProps = {
    portfolio: PortfolioLedger;
    derivation: ILedgerDerivation;
    showDivider?: boolean;
};

export const DerivedWalletRow = (props: DerivedWalletRowProps) => {
    const { portfolio, derivation, showDivider } = props;

    const toast = useToast();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const entities = useActivePortfolioEntities();

    const { mutateAsync: updateDerivationMeta } = useUpdateDerivationMeta();

    const wallet = derivation.chains.btc.wallets[0];
    const { data: balance } = useBtcBalance(wallet);

    const formattedBalance = useFormattedAmount(balance?.display);
    const address = wallet.address;
    const isBalanceLoading = balance === undefined;

    const isActive =
        isDerivableEntities(entities) &&
        entities.portfolio.id.isEq(portfolio.id) &&
        entities.derivation.index === derivation.index;

    const subtitle = isBalanceLoading ? undefined : (
        <>
            <Text variant="bodyM" color="secondary">
                {formattedBalance}
            </Text>
            <Text variant="bodyM" color="tertiary">
                {` · ${ellipsisMiddle(address)}`}
            </Text>
        </>
    );

    const handleEdit = () => {
        navigation.navigate('CustomizeWalletModal', {
            hasBackButton: true,
            defaultName: derivation.meta.name,
            defaultIcon: portfolio.meta.icon,
            tag: derivation.index + 1,
            onSave: async meta => {
                await updateDerivationMeta({
                    portfolio,
                    derivationIndex: derivation.index,
                    name: meta.name
                });

                navigation.getParent()?.goBack();
            },
            onClose: () => navigation.getParent()?.goBack()
        });
    };

    const handleHide = () => {
        if (portfolio.getDerivations().length <= 1) {
            toast(t('derivedWallets.cannotRemoveLast'));
            return;
        }

        navigation.navigate('RemoveWalletSheet', { derivationIndex: derivation.index });
    };

    return (
        <LedgerDerivationRow
            index={derivation.index}
            title={derivation.meta.name}
            subtitle={subtitle}
            badge={isActive ? <Badge isUppercase>{t('derivedWallets.active')}</Badge> : undefined}
            isSubtitleLoading={isBalanceLoading}
            showDivider={showDivider}
            accessory={
                <View style={styles.actions}>
                    <Button type="tertiary" size="small" onPress={handleHide}>
                        {t('derivedWallets.hide')}
                    </Button>
                    <Button
                        size="small"
                        type="tertiary"
                        onPress={handleEdit}
                        style={styles.editButton}
                    >
                        <Icon icon={Pencil16} color="constantWhite" />
                    </Button>
                </View>
            }
        />
    );
};
