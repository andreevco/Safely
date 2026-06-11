import { View } from 'react-native';

import type { IDerivation } from '@safely/core';
import { ellipsisMiddle } from '@safely/core';
import { useBtcBalance, useFormattedAmount } from '@safely/ux';

import { Badge, Cell, Text } from '@mobile/shared/ui';

import { styles } from './DerivationRow.styles';

type DerivationRowProps = {
    derivation: IDerivation;
    isSelected: boolean;
};

export const DerivationRow = (props: DerivationRowProps) => {
    const { derivation, isSelected } = props;

    const wallet = derivation.chains.btc.wallets[0];
    const { data: balance } = useBtcBalance(wallet);
    const formatted = useFormattedAmount(balance?.display);

    return (
        <Cell background={isSelected ? 'tertiary' : 'secondary'} style={styles.cell}>
            <Cell.Content>
                <Cell.Row style={styles.row}>
                    <View style={styles.address}>
                        <Badge>{`#${derivation.index + 1}`}</Badge>
                        <Cell.Title>{ellipsisMiddle(wallet.address)}</Cell.Title>
                    </View>
                    <Text
                        variant="bodyM"
                        color={isSelected ? 'secondary' : 'tertiary'}
                        skeleton
                        skeletonWidth={42}
                        skeletonVariant="transparentElement"
                    >
                        {formatted}
                    </Text>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
