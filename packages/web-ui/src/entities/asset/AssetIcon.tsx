import type { CSSProperties, FC } from 'react';

import type { CryptoAsset } from '@safely/core';

import { iconStyles } from './AssetIcon.styles';
import { btcLogo } from '../../shared';

const KNOWN_IMAGES: Record<string, string> = {
    '/resources/images/btc-logo.svg': btcLogo
};

export type AssetIconProps = {
    asset: CryptoAsset;
    size: number;
};

export const AssetIcon: FC<AssetIconProps> = props => {
    const { asset, size } = props;

    const source = asset.image === undefined ? undefined : KNOWN_IMAGES[asset.image];

    if (source === undefined) {
        return null;
    }

    return (
        <img
            src={source}
            alt=""
            className={iconStyles}
            style={{ width: size, height: size } as CSSProperties}
        />
    );
};
