import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ViewStyle } from 'react-native';

import { type CryptoAssetAmount, type CryptoFiatRate } from '@safely/core';
import {
    useActiveBtcWalletUtxo,
    useLastBtcTransactionTimestamp,
    useNumberFormatter,
    useRelativeTime
} from '@safely/ux';

import { Cell } from '@mobile/shared/ui';

import { styles } from './BtcAssetCell.styles';
import { ReceivingBadges } from './ReceivingBadge';

type BtcAssetCellProps = {
    cryptoAssetAmount: CryptoAssetAmount;
    price: CryptoFiatRate | null;
    showDivider?: boolean;
    onPress?: () => void;
};

export const BtcAssetCell = (props: BtcAssetCellProps) => {
    const { cryptoAssetAmount, price, showDivider = true, onPress } = props;
    const { t } = useTranslation();
    const formatter = useNumberFormatter();

    const { data: btcUtxo, isPending: isUtxoPending } = useActiveBtcWalletUtxo();
    const { data: lastTransactionTimestamp, isPending: isHistoryPending } =
        useLastBtcTransactionTimestamp();

    const receivingUtxoValues = useMemo(
        () => btcUtxo?.unconfirmedUnsafe.utxos.map(u => u.value) ?? [],
        [btcUtxo]
    );

    const timeAgo = useRelativeTime(lastTransactionTimestamp ?? null);

    const isSubtitleLoading = isUtxoPending || isHistoryPending;
    const hasReceiving = receivingUtxoValues.length > 0;

    let subtitle;

    if (isSubtitleLoading) {
        subtitle = <Cell.Subtitle skeletonWidth={140} />;
    } else if (hasReceiving) {
        subtitle = <ReceivingBadges utxo={btcUtxo!.unconfirmedUnsafe.utxos} />;
    } else if (timeAgo) {
        subtitle = (
            <Cell.Subtitle color="secondary" numberOfLines={undefined} style={styles.subtitle}>
                {t('assetCell.lastTransaction', { timeAgo })}
            </Cell.Subtitle>
        );
    } else {
        subtitle = (
            <Cell.Subtitle color="secondary" numberOfLines={undefined} style={styles.subtitle}>
                {t('assetCell.noTransactions')}
            </Cell.Subtitle>
        );
    }

    return (
        <Cell showDivider={showDivider} onPress={onPress} style={styles.cell as ViewStyle}>
            <Cell.Image type="image" image={cryptoAssetAmount.asset.image} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title color="primary">{cryptoAssetAmount.asset.name}</Cell.Title>
                    <Cell.Value color="primary">
                        {price ? cryptoAssetAmount.convert(price).format(formatter) : '–'}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row style={styles.subtitleRow}>
                    {subtitle}
                    <Cell.Subvalue color="secondary" style={styles.subvalue}>
                        {cryptoAssetAmount.format(formatter)}
                    </Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
