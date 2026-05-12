import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { AmountInputType } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { TransactionCell } from '../TransactionCell';

export type AmountProps = {
    fiatAmount: string;
    cryptoAmount: string;
    inputType: AmountInputType;
};

export const Amount = (props: AmountProps) => {
    const { fiatAmount, cryptoAmount, inputType } = props;
    const { t } = useTranslation();

    const isFiatPrimary = inputType === 'fiat';
    const primary = isFiatPrimary ? fiatAmount : cryptoAmount;
    const secondary = isFiatPrimary ? cryptoAmount : fiatAmount;

    return (
        <TransactionCell
            title={t('confirmation.amount')}
            value={
                <View>
                    <Text variant="bodyM">{primary}</Text>
                    <Text variant="bodyM" color="tertiary">
                        {secondary}
                    </Text>
                </View>
            }
        />
    );
};
