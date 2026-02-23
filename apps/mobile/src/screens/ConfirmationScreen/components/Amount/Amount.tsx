import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@mobile/shared/ui';

import { TransactionCell } from '../TransactionCell';

export type AmountProps = {
    fiatAmount?: string;
    cryptoAmount: string;
};

export const Amount = (props: AmountProps) => {
    const { fiatAmount, cryptoAmount } = props;
    const { t } = useTranslation();

    return (
        <TransactionCell
            title={t('confirmation.amount')}
            value={
                <View>
                    {fiatAmount && <Text variant="bodyM">{fiatAmount}</Text>}
                    <Text variant="bodyM" color={fiatAmount ? 'tertiary' : 'primary'}>
                        {cryptoAmount}
                    </Text>
                </View>
            }
        />
    );
};
