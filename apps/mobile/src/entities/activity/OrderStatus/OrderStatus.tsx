import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import type { RampOrder } from '@safely/core';
import type { OrderActivityItem } from '@safely/ux';

import { TableCell } from '@mobile/shared/ui';

import { TransactionConfirmationStatusBtc } from '../TransactionConfirmationStatusBtc';

const OrderStatusValue: FC<{ status: RampOrder['status'] }> = ({ status }) => {
    const { t } = useTranslation();

    switch (status) {
        case 'failed':
        case 'mismatched':
            return (
                <>
                    <TableCell.Value>{t('history.orderInfo.status.failed')}</TableCell.Value>
                    <TableCell.Value color="secondary">
                        {t('history.orderInfo.status.contactSupport')}
                    </TableCell.Value>
                </>
            );
        case 'expired':
            return (
                <TableCell.Value color="secondary">
                    {t('history.orderInfo.status.cancelled')}
                </TableCell.Value>
            );
        case 'completed':
            return (
                <TableCell.Value color="accentGreen">
                    {t('history.orderInfo.status.completed')}
                </TableCell.Value>
            );
        default:
            return <TableCell.Value>{t('history.orderInfo.status.pending')}</TableCell.Value>;
    }
};

export const OrderStatus: FC<{ order: OrderActivityItem }> = ({ order }) => {
    const { t } = useTranslation();

    if (order.transaction) {
        return (
            <TableCell>
                <TransactionConfirmationStatusBtc tx={order.transaction.raw} />
            </TableCell>
        );
    }

    return (
        <TableCell>
            <TableCell.Column leading>
                <TableCell.Label>{t('history.orderInfo.status.title')}</TableCell.Label>
            </TableCell.Column>
            <TableCell.Column>
                <OrderStatusValue status={order.order.status} />
            </TableCell.Column>
        </TableCell>
    );
};
