import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type ViewStyle } from 'react-native';

import type { CryptoAssetAmount, CryptoFiatRate } from '@safely/core';
import {
    useActiveBtcWalletUtxo,
    useHomeScreenAmountOrder,
    useNumberFormatter,
    useOnrampTxids
} from '@safely/ux';

import { Cell, ChevronRight12, Icon } from '@mobile/shared/ui';

import { styles } from './BtcAssetCell.styles';
import { ReceivingBadges } from './ReceivingBadge';

type BtcAssetCellProps = {
    cryptoAssetAmount: CryptoAssetAmount;
    price: CryptoFiatRate | null;
    showDivider?: boolean;
    style?: ViewStyle;
    background?: 'tertiary' | 'secondary';
    onPress?: () => void;
};

export const BtcAssetCell = (props: BtcAssetCellProps) => {
    const { cryptoAssetAmount, price, showDivider = true, style, background, onPress } = props;

    const { t } = useTranslation();
    const formatter = useNumberFormatter();
    const purchaseTxids = useOnrampTxids();

    const amountOrder = useHomeScreenAmountOrder();

    const { data: btcUtxo } = useActiveBtcWalletUtxo();

    const fiatAmount = price ? cryptoAssetAmount.convert(price).format(formatter) : '–';
    const cryptoAmount = cryptoAssetAmount.format(formatter, { fullPrecision: true });

    const [primaryAmount, secondaryAmount] =
        amountOrder === 'crypto' ? [cryptoAmount, fiatAmount] : [fiatAmount, cryptoAmount];

    const receivingUtxos = useMemo(() => btcUtxo?.unconfirmedUnsafe.utxos ?? [], [btcUtxo]);

    const hasReceiving = receivingUtxos.length > 0;

    return (
        <Cell
            showDivider={showDivider}
            onPress={onPress}
            background={background}
            style={[styles.cell as ViewStyle, style]}
        >
            <Cell.Image style={styles.image} type="image" image={cryptoAssetAmount.asset.image} />
            <Cell.Content>
                <Cell.Row style={styles.titleRow}>
                    <Cell.Title color="primary">{cryptoAssetAmount.asset.name}</Cell.Title>
                    <Cell.Value color="primary">{primaryAmount}</Cell.Value>
                </Cell.Row>
                <Cell.Row style={styles.subtitleRow}>
                    <View style={styles.subtitleContainer}>
                        <Cell.Subtitle color="secondary">{t('assetCell.history')}</Cell.Subtitle>
                        <Icon style={styles.chevron} icon={ChevronRight12} color="tertiary" />
                    </View>
                    <Cell.Subvalue color="secondary" style={styles.subvalue}>
                        {secondaryAmount}
                    </Cell.Subvalue>
                </Cell.Row>

                {hasReceiving && (
                    <Cell.Row>
                        <ReceivingBadges utxos={receivingUtxos} purchaseTxids={purchaseTxids} />
                    </Cell.Row>
                )}
            </Cell.Content>
        </Cell>
    );
};
