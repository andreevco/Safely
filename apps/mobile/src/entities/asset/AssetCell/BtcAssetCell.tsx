import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type ViewStyle } from 'react-native';

import type { CryptoAssetAmount, CryptoFiatRate } from '@safely/core';
import { useActiveBtcWalletUtxo, useNumberFormatter } from '@safely/ux';

import { Cell, ChevronRight12, Icon } from '@mobile/shared/ui';

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

    const { data: btcUtxo } = useActiveBtcWalletUtxo();

    const receivingUtxoValues = useMemo(
        () => btcUtxo?.unconfirmedUnsafe.utxos.map(u => u.value) ?? [],
        [btcUtxo]
    );

    const hasReceiving = receivingUtxoValues.length > 0;

    return (
        <Cell showDivider={showDivider} onPress={onPress} style={styles.cell as ViewStyle}>
            <Cell.Image style={styles.image} type="image" image={cryptoAssetAmount.asset.image} />
            <Cell.Content>
                <Cell.Row style={styles.titleRow}>
                    <Cell.Title color="primary">{cryptoAssetAmount.asset.name}</Cell.Title>
                    <Cell.Value color="primary">
                        {price ? cryptoAssetAmount.convert(price).format(formatter) : '–'}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row style={styles.subtitleRow}>
                    <View style={styles.subtitleContainer}>
                        <Cell.Subtitle color="secondary">{t('assetCell.history')}</Cell.Subtitle>
                        <Icon style={styles.chevron} icon={ChevronRight12} color="tertiary" />
                    </View>
                    <Cell.Subvalue color="secondary" style={styles.subvalue}>
                        {cryptoAssetAmount.format(formatter, { fullPrecision: true })}
                    </Cell.Subvalue>
                </Cell.Row>

                {hasReceiving && (
                    <Cell.Row>
                        <ReceivingBadges utxos={btcUtxo!.unconfirmedUnsafe.utxos} />
                    </Cell.Row>
                )}
            </Cell.Content>
        </Cell>
    );
};
