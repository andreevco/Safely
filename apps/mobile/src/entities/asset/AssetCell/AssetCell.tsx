/* eslint-disable no-irregular-whitespace */

import { Cell } from '@mobile/shared/ui';

import { type CryptoAsset } from '@safely/core';

type AssetCellProps = {
    asset: CryptoAsset;
};

export const AssetCell = (props: AssetCellProps) => {
    const { asset } = props;

    return (
        <Cell>
            <Cell.Image type="image" image={{ uri: asset.image }} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title>{asset.name}</Cell.Title>
                    <Cell.Value>$ 93,274</Cell.Value>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle>$ 125,693</Cell.Subtitle>
                    <Cell.Subvalue>0.7421 BTC</Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
