import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { assertUnreachable } from '@safely/core';
import { BtcApiTx } from '@safely/core/api/btc';
import { useBtcTransactionDisplayStatus, useDateFormatter } from '@safely/ux';

import { TableCell } from '@mobile/shared/ui';

export const TransactionConfirmationStatusBtc: FC<{
    tx: Pick<BtcApiTx, 'blockHeight' | 'confirmations' | 'blockTime'>;
}> = ({ tx }) => {
    const { t } = useTranslation();
    const dateFormatter = useDateFormatter({
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    const status = useBtcTransactionDisplayStatus(tx);

    let Status;
    switch (status.type) {
        case 'pending':
            Status = (
                <>
                    <TableCell.Value>
                        {t('history.transactionInfo.status.pending.title')}
                    </TableCell.Value>
                    <TableCell.Value color="secondary">
                        {t('history.transactionInfo.status.pending.description')}
                    </TableCell.Value>
                </>
            );
            break;
        case 'confirmed-recently':
            Status = (
                <>
                    <TableCell.Value>
                        {t('history.transactionInfo.status.confirmed-recently.title', {
                            date: dateFormatter.format(status.timestamp)
                        })}
                    </TableCell.Value>
                    <TableCell.Value color="accentGreen">
                        {t('history.transactionInfo.status.confirmed-recently.confirmations', {
                            count: status.confirmations
                        })}
                    </TableCell.Value>
                </>
            );
            break;
        case 'confirmed-long-ago':
            Status = (
                <>
                    <TableCell.Value>
                        {t('history.transactionInfo.status.confirmed-long-ago.title', {
                            date: dateFormatter.format(status.timestamp)
                        })}
                    </TableCell.Value>
                    <TableCell.Value color="secondary">
                        {t('history.transactionInfo.status.confirmed-long-ago.description')}
                    </TableCell.Value>
                </>
            );
            break;
        default:
            assertUnreachable(status);
    }

    return (
        <>
            <TableCell.Column leading>
                <TableCell.Label>{t('history.transactionInfo.status.title')}</TableCell.Label>
            </TableCell.Column>
            <TableCell.Column>{Status}</TableCell.Column>
        </>
    );
};
