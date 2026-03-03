/* eslint-disable no-irregular-whitespace */

import { useMemo } from 'react';
import { View } from 'react-native';

import { CryptoAsset } from '@safely/core';
import { useActiveFiat, useNumberFormatter, useRate } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartHeader.styles';
import { PriceDiff } from './PriceDiff';
import { CHART_CONFIG, ChartPeriod } from '../../config';

type ChartHeaderProps = {
    asset: CryptoAsset;
    prices: [number, number][];
    selectedPeriod: ChartPeriod;
    activePrice?: number;
};

export const ChartHeader = (props: ChartHeaderProps) => {
    const { prices, asset, selectedPeriod, activePrice } = props;
    const rate = useRate(asset);
    const fiat = useActiveFiat();

    const formatter = useNumberFormatter();

    const diffInPercent = useMemo(() => {
        if (prices.length < 2) {
            return 0;
        }

        const startPoint = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const periodStartPoint = prices.find(price => price[0] * 1000 >= startPoint);

        if (!periodStartPoint) {
            return 0;
        }

        const startPrice = periodStartPoint[1];
        const endPrice = prices[prices.length - 1][1];

        if (startPrice === 0) {
            return 0;
        }

        return ((endPrice - startPrice) / startPrice) * 100;
    }, [prices, selectedPeriod]);

    const formattedRate =
        rate.data &&
        formatter.formatFiat(rate.data.value, {
            currencyDisplay: 'symbol',
            currency: fiat.id.symbol,
            useGrouping: true
        });

    const formattedActivePrice =
        activePrice !== undefined
            ? formatter.formatFiat(activePrice, {
                  currencyDisplay: 'symbol',
                  currency: fiat.id.symbol,
                  useGrouping: true
              })
            : null;

    const displayPrice = formattedActivePrice ?? formattedRate;

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Text monospace variant="titleM">
                    {displayPrice ?? '-'}
                </Text>
                <Text style={styles.description} variant="bodyM" color="tertiary">
                    {asset.symbol} / {fiat.id.symbol}
                </Text>
            </View>
            {activePrice === undefined && diffInPercent !== 0 && (
                <PriceDiff diff={diffInPercent} />
            )}
        </View>
    );
};
