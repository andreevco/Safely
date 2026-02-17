import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Estimation } from '@safely/core';
import { useFiatEquivalent, useNumberFormatter } from '@safely/ux';

import { TransactionCell } from '@mobile/screens/ConfirmationScreen/components';
import { Text } from '@mobile/shared/ui';

import { styles } from './TransactionFee.styles';

const btcBlockWaitingTimeMinutes = 10;

export const TransactionFee: FC<{ estimation: Estimation }> = ({ estimation }) => {
    const { t } = useTranslation();
    const formatter = useNumberFormatter();
    const { data: fiat } = useFiatEquivalent(estimation.fee.amount);

    const targetBlock = Math.max(estimation.txTargetBlock, 1);

    return (
        <TransactionCell
            title={t('confirmation.networkFee.title')}
            value={
                <View style={styles.feeContainer}>
                    {!!fiat && <Text variant="bodyM">{fiat.format(formatter)} </Text>}
                    <Text color="secondary" variant="bodyM">
                        {estimation.fee.amount.format(formatter)}
                    </Text>
                </View>
            }
            subvalue={t('confirmation.networkFee.timeMinutes', {
                count: targetBlock * btcBlockWaitingTimeMinutes
            })}
        />
    );
};
