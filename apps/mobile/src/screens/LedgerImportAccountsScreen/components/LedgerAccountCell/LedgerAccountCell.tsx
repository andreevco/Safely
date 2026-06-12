import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BtcAssetAmount, ellipsisMiddle, type LedgerAccount } from '@safely/core';
import { useFormattedAmount } from '@safely/ux';

import { Cell, Checkbox, Text } from '@mobile/shared/ui';

import { styles } from './LedgerAccountCell.styles';

type RealLedgerAccountCellProps = {
    account: LedgerAccount;
    isSkeleton?: false | undefined;
    isSelected: boolean;
    onPress: () => void;
};

type SkeletonLedgerAccountCellProps = {
    account: Omit<LedgerAccount, 'xpub'>;
    isSkeleton: true;
    isSelected?: undefined;
    onPress?: undefined;
};

type LedgerAccountCellProps = SkeletonLedgerAccountCellProps | RealLedgerAccountCellProps;

export const LedgerAccountCell = (props: LedgerAccountCellProps) => {
    const { account, isSelected = false, onPress, isSkeleton = false } = props;
    const { t } = useTranslation();

    const balance = useMemo(() => BtcAssetAmount.fromWeiAmount(account.balance), [account.balance]);
    const formattedBalance = useFormattedAmount(balance);

    return (
        <Cell onPress={onPress} style={styles.container}>
            <View style={styles.badgeColumn}>
                <View style={styles.badge}>
                    <Text variant="bodyM" monospace>
                        {account.index + 1}
                    </Text>
                </View>
            </View>
            <Cell.Content>
                <Cell.Row>
                    <View style={styles.titleRow}>
                        <Cell.Title>
                            {isSkeleton
                                ? undefined
                                : t('portfolio.ledgerWallet', { number: account.index + 1 })}
                        </Cell.Title>
                    </View>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle>
                        {isSkeleton
                            ? undefined
                            : `${formattedBalance} · ${ellipsisMiddle(account.address)}`}
                    </Cell.Subtitle>
                </Cell.Row>
            </Cell.Content>
            <View pointerEvents="none">
                <Checkbox isChecked={isSelected} disabled={isSkeleton} />
            </View>
        </Cell>
    );
};
