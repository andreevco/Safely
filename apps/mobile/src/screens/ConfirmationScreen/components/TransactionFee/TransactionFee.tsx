import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Estimation } from '@safely/core';
import { useFiatEquivalent, useNumberFormatter } from '@safely/ux';

import { TransactionCell } from '@mobile/screens/ConfirmationScreen/components';
import { Text } from '@mobile/shared/ui';

import { styles } from './TransactionFee.styles';

const btcBlockWaitingTimeMinutes = 10;

export const TransactionFee: FC<{ estimation: Estimation | undefined }> = ({ estimation }) => {
    const { t } = useTranslation();

    const targetBlock = estimation ? Math.max(estimation.txTargetBlock, 1) : undefined;

    return (
        <TransactionCell
            title={t('confirmation.networkFee.title')}
            value={
                estimation ? (
                    <FeeValue estimation={estimation} />
                ) : (
                    <Text variant="bodyM" skeletonVariant="transparentElement" skeletonWidth={64} />
                )
            }
            subvalue={
                <TransactionCell.Subvalue skeletonVariant="transparentElement" skeletonWidth={40}>
                    {targetBlock !== undefined
                        ? t('confirmation.networkFee.timeMinutes', {
                              count: targetBlock * btcBlockWaitingTimeMinutes
                          })
                        : undefined}
                </TransactionCell.Subvalue>
            }
        />
    );
};

const FeeValue: FC<{ estimation: Estimation }> = ({ estimation }) => {
    const formatter = useNumberFormatter();
    const { data: fiat } = useFiatEquivalent(estimation.fee.amount);

    return (
        <View style={styles.feeContainer}>
            {!!fiat && <Text variant="bodyM">{fiat.format(formatter)} </Text>}
            <Text color="secondary" variant="bodyM" skeleton>
                {estimation?.fee.amount.format(formatter)}
            </Text>
        </View>
    );
};
