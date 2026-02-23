import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';
import { useAssets, useNumberFormatter, useTotalBalance } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    const totalBalance = useTotalBalance();
    const formatter = useNumberFormatter();
    const assets = useAssets();

    if (!totalBalance.data || !assets.data) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text textAlign="center" variant="displayL">
                {totalBalance.data.format(formatter)}
            </Text>
            <Text textAlign="center" variant="bodyL" color="tertiary">
                {assets.data
                    .find(asset => asset.amount.asset.id.isEq(BTC_ASSET.id))
                    ?.amount.format(formatter)}
            </Text>
        </View>
    );
};
