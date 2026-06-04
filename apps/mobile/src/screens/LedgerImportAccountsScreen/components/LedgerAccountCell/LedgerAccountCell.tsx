import { useMemo } from 'react';
import { View } from 'react-native';

import { BtcAssetAmount, ellipsisMiddle, type LedgerAccount } from '@safely/core';
import { useFormattedAmount } from '@safely/ux';

import { Badge, Cell, Checkbox } from '@mobile/shared/ui';

import { styles } from './LedgerAccountCell.styles';

type LedgerAccountCellProps = {
    account: LedgerAccount;
    isSelected: boolean;
    onPress: () => void;
};

export const LedgerAccountCell = (props: LedgerAccountCellProps) => {
    const { account, isSelected, onPress } = props;

    const balance = useMemo(() => BtcAssetAmount.fromWeiAmount(account.balance), [account.balance]);
    const formattedBalance = useFormattedAmount(balance);

    return (
        <Cell onPress={onPress}>
            <Cell.Content>
                <Cell.Row>
                    <View style={styles.titleRow}>
                        <Cell.Title>{ellipsisMiddle(account.address)}</Cell.Title>
                        <Badge>{`#${account.index + 1}`}</Badge>
                    </View>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle>{formattedBalance}</Cell.Subtitle>
                </Cell.Row>
            </Cell.Content>
            <View pointerEvents="none">
                <Checkbox isChecked={isSelected} />
            </View>
        </Cell>
    );
};
