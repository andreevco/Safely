import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';

import { Text, Image } from '@mobile/shared/ui';

import { styles } from './AssetSelector.styles';

export const AssetSelector = () => (
    <View style={styles.imageWithText}>
        <Image source={BTC_ASSET.image} style={styles.image} />
        <View>
            <Text style={styles.label} variant="labelM">
                {BTC_ASSET.name}
            </Text>
            <Text variant="bodyM" color="secondary">
                {BTC_ASSET.symbol}
            </Text>
        </View>
    </View>
);
