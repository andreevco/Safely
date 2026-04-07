/* eslint-disable no-irregular-whitespace */

import { View } from 'react-native';

import { CryptoAsset } from '@safely/core';
import { useActiveFiat, useNumberFormatter, useRate } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartHeader.styles';
import { PriceDiff } from './PriceDiff';
import { ChartPeriod } from '../../config';
import { usePriceDiff } from '../../hooks';

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
    const priceDiff = usePriceDiff({ prices, selectedPeriod });

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
                    {asset.symbol} / {fiat.id.symbol}
                </Text>
            </View>
            {activePrice === undefined && priceDiff && (
                <PriceDiff formatted={priceDiff.formatted} isPositive={priceDiff.isPositive} />
            )}
        </View>
    );
};
