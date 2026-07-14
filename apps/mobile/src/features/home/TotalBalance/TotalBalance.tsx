import { View } from 'react-native';

import { useNumberFormatter, useTotalBalance } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { Subtitle } from './components';
import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    const totalBalance = useTotalBalance();
    const formatter = useNumberFormatter();

    return (
        <View style={styles.container}>
            <Text textAlign="center" variant="displayL" skeleton>
                {totalBalance.data?.format(formatter)}
            </Text>
            <Subtitle />
        </View>
    );
};
