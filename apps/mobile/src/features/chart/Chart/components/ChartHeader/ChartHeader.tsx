/* eslint-disable no-irregular-whitespace */

import { useMemo } from 'react';
import { View } from 'react-native';

import { CryptoAsset } from '@safely/core';
import { useActiveFiat, useNumberFormatter, useRate } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartHeader.styles';
import { PriceDiff } from './PriceDiff';

type ChartHeaderProps = {
    asset: CryptoAsset;
    prices: [number, number][];
};

export const ChartHeader = (props: ChartHeaderProps) => {
    const { prices, asset } = props;
    const rate = useRate(asset);
    const fiat = useActiveFiat();

    const formatter = useNumberFormatter();

    const diffInPercent = useMemo(() => {
        if (prices.length < 2) {
            return 0;
        }

        return ((prices[prices.length - 1][1] - prices[0][1]) / prices[prices.length - 1][1]) * 100;
    }, [prices]);

    const formattedRate =
        rate.data &&
        formatter.formatFiat(rate.data.value, {
            currencyDisplay: 'symbol',
            currency: fiat.id.symbol,
            useGrouping: true
        });

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Text monospace variant="titleM">
                    {formattedRate ?? '-'}
                </Text>
                <Text style={styles.description} variant="bodyM" color="tertiary">
                    {asset.symbol} / {fiat.id.symbol}
                </Text>
            </View>
            <PriceDiff diff={diffInPercent} />
        </View>
    );
};
