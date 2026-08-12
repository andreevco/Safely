import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';
import {
    useActiveWalletBtcBalance,
    useMainBalanceUnit,
    useNumberFormatter,
    useTotalBalance
} from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { Subtitle } from './components';
import { styles } from './TotalBalance.styles';

export const TotalBalance = () => {
    const totalBalance = useTotalBalance();
    const formatter = useNumberFormatter();
    const mainBalanceUnit = useMainBalanceUnit();
    const btcBalance = useActiveWalletBtcBalance();

    return (
        <View style={styles.container}>
            {mainBalanceUnit === 'crypto' ? (
                <View style={styles.cryptoAmount}>
                    <Text variant="displayL" skeleton>
                        {btcBalance.data?.display.format(formatter, { currencyDisplay: 'none' })}
                    </Text>
                    <Text variant="bodyL" color="tertiary">
                        {BTC_ASSET.symbol}
                    </Text>
                </View>
            ) : (
                <Text textAlign="center" variant="displayL" skeleton>
                    {totalBalance.data?.format(formatter)}
                </Text>
            )}
            <Subtitle />
        </View>
    );
};
