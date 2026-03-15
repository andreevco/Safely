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
            return null;
        }

        const startPoint = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const periodStartPoint = prices.find(price => price[0] * 1000 >= startPoint);

        if (!periodStartPoint) {
            return null;
        }

        const startPrice = periodStartPoint[1];
        const endPrice = prices[prices.length - 1][1];

        if (startPrice === 0) {
            return null;
        }

        const diff = ((endPrice - startPrice) / startPrice) * 100;
        const abs = Math.abs(diff);

        let formatted: string;
        if (abs >= 1) {
            formatted = parseFloat(abs.toFixed(1)).toString();
        } else if (abs === 0) {
            return null;
        } else {
            const decimals = -Math.floor(Math.log10(abs));
            formatted = abs.toFixed(decimals);
        }

        return { formatted, isPositive: diff > 0 };
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
            {activePrice === undefined && diffInPercent && (
                <PriceDiff
                    formatted={diffInPercent.formatted}
                    isPositive={diffInPercent.isPositive}
                />
            )}
        </View>
    );
};
