import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type BtcAssetAmount, ellipsisMiddle, type LedgerAccount } from '@safely/core';
import { useFormattedAmount } from '@safely/ux';

import { Cell, Checkbox, Text } from '@mobile/shared/ui';

import { styles } from './LedgerAccountCell.styles';

type RealLedgerAccountCellProps = {
    account: LedgerAccount;
    balance: BtcAssetAmount | undefined;
    isSkeleton?: false | undefined;
    isSelected: boolean;
    onPress: () => void;
};

type SkeletonLedgerAccountCellProps = {
    account: Pick<LedgerAccount, 'index'>;
    balance?: undefined;
    isSkeleton: true;
    isSelected?: undefined;
    onPress?: undefined;
};

type LedgerAccountCellProps = SkeletonLedgerAccountCellProps | RealLedgerAccountCellProps;

export const LedgerAccountCell = (props: LedgerAccountCellProps) => {
    const { account, balance, isSelected = false, onPress, isSkeleton = false } = props;
    const { t } = useTranslation();

    const formattedBalance = useFormattedAmount(balance);
    const isBalanceLoading = !isSkeleton && balance === undefined;

    return (
        <Cell skeleton={isSkeleton} onPress={onPress} style={styles.container}>
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
                    <Cell.Subtitle skeleton={isBalanceLoading} skeletonWidth={140}>
                        {isSkeleton || isBalanceLoading || !('address' in account)
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
