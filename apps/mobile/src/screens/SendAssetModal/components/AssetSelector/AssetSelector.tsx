import { resources } from '@mobile/shared/resources';
import { Text } from '@mobile/shared/ui/Text';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { styles } from './AssetSelector.styles';

export const AssetSelector = () => (
    <View style={styles.imageWithText}>
        <Image source={resources.btcLogo} style={styles.image} />
        <View>
            <Text style={styles.label} variant="labelM">
                BTC
            </Text>
            <Text variant="bodyM" color="secondary">
                Bitcoin
            </Text>
        </View>
    </View>
);
