import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BtcApiUtxo, BtcAssetAmount } from '@safely/core';
import { useNumberFormatter } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ReceivingBadge.styles';

export const ReceivingBadges = ({ utxo }: { utxo: BtcApiUtxo[] }) => {
    const { t } = useTranslation();
    const formatter = useNumberFormatter();

    if (utxo.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {utxo.map(u => (
                <View key={`${u.txid}:${u.vout}`} style={styles.badge}>
                    <Text variant="bodyM" color="primary">
                        {t('pendingFunds.receiving', {
                            amount: BtcAssetAmount.fromWeiAmount(u.value).format(formatter)
                        })}
                    </Text>
                </View>
            ))}
        </View>
    );
};
