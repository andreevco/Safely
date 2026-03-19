import { View } from 'react-native';

import { type CryptoAssetAmount, type CryptoFiatRate } from '@safely/core';
import { useActiveFiat, useNumberFormatter } from '@safely/ux';

import { Cell } from '@mobile/shared/ui';

type AssetCellProps = {
    cryptoAssetAmount: CryptoAssetAmount;
    price: CryptoFiatRate | null;
    showDivider?: boolean;
    onPress?: () => void;
};

export const AssetCell = (props: AssetCellProps) => {
    const { cryptoAssetAmount, price, showDivider = true, onPress } = props;
    const formatter = useNumberFormatter();
    const fiat = useActiveFiat();

    const priceFormatted =
        price &&
        formatter.formatFiat(price.value, {
            currencyDisplay: 'symbol',
            currency: fiat.id.symbol,
            useGrouping: true
        });

    return (
        <Cell showDivider={showDivider} onPress={onPress}>
            <Cell.Image type="image" image={cryptoAssetAmount.asset.image} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title color="primary">{cryptoAssetAmount.asset.name}</Cell.Title>
                    <Cell.Value color="primary">
                        {price ? cryptoAssetAmount.convert(price).format(formatter) : '–'}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row>
                    {priceFormatted ? (
                        <Cell.Subtitle color="secondary">{priceFormatted}</Cell.Subtitle>
                    ) : (
                        <View />
                    )}
                    <Cell.Subvalue color="secondary">
                        {cryptoAssetAmount.format(formatter)}
                    </Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
