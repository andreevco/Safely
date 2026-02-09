import { View } from 'react-native';

import { type CryptoAssetAmount, type CryptoFiatRate } from '@safely/core';
import { useActiveFiat, useNumberFormatter } from '@safely/ux';

import { resources } from '@mobile/shared/resources';
import { Cell } from '@mobile/shared/ui';

type AssetCellProps = {
    cryptoAssetAmount: CryptoAssetAmount;
    price: CryptoFiatRate | null;
};

export const AssetCell = (props: AssetCellProps) => {
    const { cryptoAssetAmount, price } = props;
    const formatter = useNumberFormatter();

    const activeFiat = useActiveFiat();

    const priceFormatted =
        price &&
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: activeFiat.id.symbol,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price.value.toNumber());

    return (
        <Cell>
            <Cell.Image type="image" image={resources.btcLogo} />
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
