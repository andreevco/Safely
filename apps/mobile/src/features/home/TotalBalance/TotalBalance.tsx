import { View } from 'react-native';

import { ellipsisMiddle } from '@safely/core';
import { useActiveBtcWallet, useNumberFormatter, useTotalBalance } from '@safely/ux';

import { Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    const totalBalance = useTotalBalance();
    const formatter = useNumberFormatter();
    const activeWallet = useActiveBtcWallet();
    const handleCopy = useCopy();

    return (
        <View style={styles.container}>
            <Text textAlign="center" variant="displayL" skeleton>
                {totalBalance.data?.format(formatter)}
            </Text>
            <Text
                onPress={() => handleCopy(activeWallet.address)}
                textAlign="center"
                variant="bodyL"
                color="tertiary"
            >
                {ellipsisMiddle(activeWallet.address, 4)}
            </Text>
        </View>
    );
};
