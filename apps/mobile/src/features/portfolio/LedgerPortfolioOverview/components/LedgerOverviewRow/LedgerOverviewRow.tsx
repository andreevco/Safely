import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    type BtcAssetAmount,
    ellipsisMiddle,
    type IDerivation,
    type PortfolioLedger
} from '@safely/core';
import {
    useFormattedAmount,
    useHideDerivation,
    useToast,
    useUpdateDerivationMeta
} from '@safely/ux';

import { LedgerDerivationRow } from '@mobile/features/ledger';
import { Button } from '@mobile/shared/ui';

import { styles } from './LedgerOverviewRow.styles';

type LedgerOverviewRowProps = {
    portfolio: PortfolioLedger;
    derivation: IDerivation;
    balance: BtcAssetAmount | undefined;
};

export const LedgerOverviewRow = (props: LedgerOverviewRowProps) => {
    const { portfolio, derivation, balance } = props;

    const { t } = useTranslation();
    const navigation = useNavigation();

    const { mutate: hideDerivation } = useHideDerivation();
    const { mutateAsync: updateDerivationMeta } = useUpdateDerivationMeta();
    const toast = useToast();

    const fallbackName = t('portfolio.ledgerWallet', { number: derivation.index + 1 });
    const name = derivation.name ?? fallbackName;

    const formattedBalance = useFormattedAmount(balance);
    const address = derivation.chains.btc.wallets[0].address;
    const isBalanceLoading = balance === undefined;
    const subtitle = isBalanceLoading
        ? undefined
        : `${formattedBalance} · ${ellipsisMiddle(address)}`;

    const handleEdit = () => {
        navigation.navigate('CustomizeWalletModal', {
            hasBackButton: true,
            initialMeta: { name, icon: derivation.icon },
            onSave: async meta => {
                await updateDerivationMeta({
                    portfolio,
                    derivationIndex: derivation.index,
                    name: meta.name === fallbackName ? undefined : meta.name,
                    icon: meta.icon
                });

                navigation.goBack();
            },
            onCompleteCustomize: () => navigation.goBack()
        });
    };

    const handleHide = () => {
        if (portfolio.getDerivations().length <= 1) {
            toast(t('ledgerOverview.cannotRemoveLast'));
            return;
        }

        hideDerivation({ portfolio, derivationIndex: derivation.index });
    };

    return (
        <LedgerDerivationRow
            index={derivation.index}
            title={name}
            subtitle={subtitle}
            isSubtitleLoading={isBalanceLoading}
            accessory={
                <View style={styles.actions}>
                    <Button type="secondary" size="small" onPress={handleEdit}>
                        {t('ledgerOverview.edit')}
                    </Button>
                    <Button type="secondary" size="small" onPress={handleHide}>
                        {t('ledgerOverview.hide')}
                    </Button>
                </View>
            }
        />
    );
};
