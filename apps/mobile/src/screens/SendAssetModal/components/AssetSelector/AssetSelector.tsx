import type { CryptoAsset } from '@safely/core';

import { Image } from '@mobile/shared/ui';

import { styles } from './AssetSelector.styles';

export const AssetSelector = ({ asset }: { asset: CryptoAsset }) => (
    <Image source={asset.image} style={styles.image} />
);
