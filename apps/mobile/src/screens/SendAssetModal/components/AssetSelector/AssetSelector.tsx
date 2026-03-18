import { BTC_ASSET } from '@safely/core';

import { Image } from '@mobile/shared/ui';

import { styles } from './AssetSelector.styles';

export const AssetSelector = () => <Image source={BTC_ASSET.image} style={styles.image} />;
