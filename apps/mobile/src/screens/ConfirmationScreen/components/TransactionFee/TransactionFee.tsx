import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { TransactionFee as ITransactionFee } from '@safely/core';
import { useFiatEquivalent, useNumberFormatter } from '@safely/ux';

import { TransactionCell } from '@mobile/screens/ConfirmationScreen/components';

export const TransactionFee: FC<{ fee: ITransactionFee }> = ({ fee }) => {
    const { t } = useTranslation();
    const formatter = useNumberFormatter();
    const { data: fiat } = useFiatEquivalent(fee.amount);

    return (
        <TransactionCell
            title={t('confirmation.networkFee')}
            value={fee.amount.format(formatter)}
            subvalue={fiat?.format(formatter)}
        />
    );
};
