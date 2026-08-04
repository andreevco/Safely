import { useTranslation } from 'react-i18next';

import type { SyncedDeviceDetails } from '@safely/ux';
import { useDateFormatter } from '@safely/ux';

import { List, TableCell } from '@mobile/shared/ui';

import { useConnectionLabel } from './useConnectionLabel';

type DeviceBlockProps = {
    details: SyncedDeviceDetails;
};

export const DeviceBlock = ({ details }: DeviceBlockProps) => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter({ day: 'numeric', month: 'short', year: 'numeric' });
    const connectionLabel = useConnectionLabel(details.lastSyncAt);

    return (
        <List>
            <List.Title>{t('security.deviceDetails.device')}</List.Title>
            <List.Group>
                <TableCell columnDivider>
                    <TableCell.Column leading>
                        <TableCell.Label>{t('security.deviceDetails.added')}</TableCell.Label>
                    </TableCell.Column>
                    <TableCell.Column>
                        <TableCell.Value>
                            {formatDate.format(details.meta.pairedAt)}
                        </TableCell.Value>
                    </TableCell.Column>
                </TableCell>
                <TableCell columnDivider>
                    <TableCell.Column leading>
                        <TableCell.Label>{t('security.deviceDetails.connection')}</TableCell.Label>
                    </TableCell.Column>
                    <TableCell.Column>
                        <TableCell.Value>{connectionLabel}</TableCell.Value>
                    </TableCell.Column>
                </TableCell>
            </List.Group>
        </List>
    );
};
