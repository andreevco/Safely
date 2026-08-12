import { useTranslation } from 'react-i18next';

import { SPACE } from '@safely/core';
import type { SyncedDeviceDetails } from '@safely/ux';
import { useDateFormatter } from '@safely/ux';

import { List, TableCell, Text } from '@mobile/shared/ui';

import { useConnectionLabel } from './useConnectionLabel';
import { StaleWarningBanner } from '../StaleWarningBanner';

type DeviceBlockProps = {
    details: SyncedDeviceDetails;
};

export const DeviceBlock = ({ details }: DeviceBlockProps) => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter({ day: 'numeric', month: 'short', year: 'numeric' });
    const connection = useConnectionLabel(details.lastSyncAt);
    const showStaleWarning =
        details.archive === null && details.isStale && !details.isStaleWarningHidden;

    return (
        <List>
            <List.Title>{t('security.deviceDetails.device')}</List.Title>
            <List.Group withoutBottomMargin={showStaleWarning || details.archive !== null}>
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
                {details.archive === null && (
                    <TableCell columnDivider>
                        <TableCell.Column leading>
                            <TableCell.Label>
                                {t('security.deviceDetails.connection')}
                            </TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>
                                {connection.label}
                                {connection.date !== null && (
                                    <Text variant="bodyM" color="secondary">
                                        {`${SPACE.NBSP}·${SPACE.NBSP}${connection.date}`}
                                    </Text>
                                )}
                            </TableCell.Value>
                        </TableCell.Column>
                    </TableCell>
                )}
                {details.archive !== null && (
                    <TableCell columnDivider>
                        <TableCell.Column leading>
                            <TableCell.Label>
                                {t('security.deviceDetails.archived')}
                            </TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>
                                {formatDate.format(details.archive.archivedAt)}
                            </TableCell.Value>
                        </TableCell.Column>
                    </TableCell>
                )}
                {details.archive !== null && (
                    <TableCell columnDivider>
                        <TableCell.Column leading>
                            <TableCell.Label>{t('security.deviceDetails.reason')}</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>
                                {details.archive.isSignedOut
                                    ? t('security.deviceDetails.reasonSignedOut', {
                                          deviceName: details.meta.name
                                      })
                                    : t('security.deviceDetails.reasonArchivedFrom', {
                                          deviceName: details.archive.archivedFromDeviceName
                                      })}
                            </TableCell.Value>
                        </TableCell.Column>
                    </TableCell>
                )}
            </List.Group>
            {showStaleWarning && <StaleWarningBanner details={details} />}
        </List>
    );
};
