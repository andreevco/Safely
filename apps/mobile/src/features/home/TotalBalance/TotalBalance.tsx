import { View } from 'react-native';

import { ellipsisMiddle } from '@safely/core';
import { useActiveBtcWallet, useNumberFormatter, useTotalBalance } from '@safely/ux';

import { Skeleton, Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    const totalBalance = useTotalBalance();
    const formatter = useNumberFormatter();
    const activeWallet = useActiveBtcWallet();
    const handleCopy = useCopy();

    return (
        <View style={styles.container}>
            {totalBalance.data ? (
                <Text textAlign="center" variant="displayL">
                    {totalBalance.data.format(formatter)}
                </Text>
            ) : (
                <View style={styles.skeletonContainer}>
                    <Skeleton width={96} height={32} borderRadius={8} />
                </View>
            )}
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
