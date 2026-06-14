import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { IDerivation } from '@safely/core';
import { useBtcWalletFiatBalance, useNumberFormatter } from '@safely/ux';

import { Badge, Cell, Text } from '@mobile/shared/ui';

import { styles } from './DerivationRow.styles';

type DerivationRowProps = {
    derivation: IDerivation;
    isSelected: boolean;
};

export const DerivationRow = (props: DerivationRowProps) => {
    const { derivation, isSelected } = props;

    const { t } = useTranslation();
    const wallet = derivation.chains.btc.wallets[0];
    const { data: balance } = useBtcWalletFiatBalance(wallet);
    const formatter = useNumberFormatter();

    const name = derivation.name ?? t('portfolio.ledgerWallet', { number: derivation.index + 1 });

    return (
        <Cell background={isSelected ? 'tertiary' : 'secondary'} style={styles.cell}>
            <Cell.Content>
                <Cell.Row style={styles.row}>
                    <View style={styles.address}>
                        <View style={styles.badgeColumn}>
                            <Badge>{`#${derivation.index + 1}`}</Badge>
                        </View>
                        <Cell.Title>{name}</Cell.Title>
                    </View>
                    <Text
                        variant="bodyM"
                        color={isSelected ? 'secondary' : 'tertiary'}
                        skeleton
                        skeletonWidth={42}
                        skeletonVariant="transparentElement"
                    >
                        {balance?.format(formatter)}
                    </Text>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
