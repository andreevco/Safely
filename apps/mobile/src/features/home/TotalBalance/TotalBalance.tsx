import { Text } from '@mobile/shared/ui';
import { View } from 'react-native';

import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    return (
        <View style={styles.container}>
            <Text textAlign="center" variant="displayL">
                $ 93,274
            </Text>
            <Text textAlign="center" variant="bodyL" color="secondary">
                0.7421 BTC
            </Text>
        </View>
    );
};
