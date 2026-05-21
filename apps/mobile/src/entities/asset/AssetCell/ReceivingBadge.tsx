import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { BtcApiUtxoWithOptionalTx } from '@safely/core';
import { BtcAssetAmount } from '@safely/core';
import { useNumberFormatter, btcTxToActivityItem } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './ReceivingBadge.styles';

export const ReceivingBadges = ({ utxos }: { utxos: BtcApiUtxoWithOptionalTx[] }) => {
    const { t } = useTranslation();
    const formatter = useNumberFormatter();
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const handleReceivingPress = useCallback(
        (u: BtcApiUtxoWithOptionalTx) => {
            if (!u?.tx) {
                return;
            }

            const activity = btcTxToActivityItem(u.tx);
            if (activity) {
                navigation.navigate('TransactionScreen', { activity });
            }
        },
        [navigation]
    );

    if (utxos.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {utxos.map(u => (
                <TouchableOpacity
                    key={`${u.txid}:${u.vout}`}
                    style={styles.badge}
                    onPress={() => handleReceivingPress(u)}
                >
                    <Text variant="bodyM" color="primary">
                        {t('pendingFunds.receiving', {
                            amount: BtcAssetAmount.fromWeiAmount(u.value).format(formatter)
                        })}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};
