import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type BtcAssetAmount, ellipsisMiddle, type LedgerAccount } from '@safely/core';
import { useFormattedAmount } from '@safely/ux';

import { LedgerDerivationRow } from '@mobile/features/ledger';
import { Checkbox } from '@mobile/shared/ui';

type RealLedgerAccountCellProps = {
    account: LedgerAccount;
    balance: BtcAssetAmount | undefined;
    isSkeleton?: false | undefined;
    isSelected: boolean;
    isLocked?: boolean;
    onPress: () => void;
};

type SkeletonLedgerAccountCellProps = {
    account: Pick<LedgerAccount, 'index'>;
    balance?: undefined;
    isSkeleton: true;
    isSelected?: undefined;
    isLocked?: undefined;
    onPress?: undefined;
};

type LedgerAccountCellProps = SkeletonLedgerAccountCellProps | RealLedgerAccountCellProps;

export const LedgerAccountCell = (props: LedgerAccountCellProps) => {
    const {
        account,
        balance,
        isSelected = false,
        isLocked = false,
        onPress,
        isSkeleton = false
    } = props;
    const { t } = useTranslation();

    const formattedBalance = useFormattedAmount(balance);
    const isBalanceLoading = !isSkeleton && balance === undefined;

    const subtitle =
        isSkeleton || isBalanceLoading || !('address' in account)
            ? undefined
            : `${formattedBalance} · ${ellipsisMiddle(account.address)}`;

    return (
        <LedgerDerivationRow
            index={account.index}
            title={
                isSkeleton ? undefined : t('portfolio.ledgerWallet', { number: account.index + 1 })
            }
            subtitle={subtitle}
            isSubtitleLoading={isBalanceLoading}
            isSkeleton={isSkeleton}
            isDimmed={isLocked}
            onPress={onPress}
            accessory={
                <View pointerEvents="none">
                    <Checkbox isChecked={isSelected} disabled={isSkeleton || isLocked} />
                </View>
            }
        />
    );
};
