import { useTranslation } from 'react-i18next';

import type { SyncedDeviceDetails } from '@safely/ux';
import { SyncedDeviceDataStatus } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Banner, DeviceLink, Icon, List, TableCell, Text } from '@mobile/shared/ui';

import { styles } from './DataSyncBlock.styles';

function statusLabelKey(status: SyncedDeviceDataStatus): string {
    switch (status) {
        case SyncedDeviceDataStatus.SYNCED:
            return 'security.deviceDetails.synced';
        case SyncedDeviceDataStatus.NOT_SYNCED:
            return 'security.deviceDetails.notSynced';
        case SyncedDeviceDataStatus.UNKNOWN:
            return 'security.deviceDetails.unknown';
    }
}

function statusColor(status: SyncedDeviceDataStatus): 'accentGreen' | 'accentRed' | 'accentOrange' {
    switch (status) {
        case SyncedDeviceDataStatus.SYNCED:
            return 'accentGreen';
        case SyncedDeviceDataStatus.NOT_SYNCED:
            return 'accentRed';
        case SyncedDeviceDataStatus.UNKNOWN:
            return 'accentOrange';
    }
}

type DataSyncBlockProps = {
    details: SyncedDeviceDetails;
};

export const DataSyncBlock = ({ details }: DataSyncBlockProps) => {
    const { t } = useTranslation();
    const isSynced = details.dataStatus === SyncedDeviceDataStatus.SYNCED;
    const isUnknown = details.dataStatus === SyncedDeviceDataStatus.UNKNOWN;

    return (
        <List>
            <List.Title>{t('security.deviceDetails.dataSync')}</List.Title>
            <List.Group withoutBottomMargin={isSynced}>
                <TableCell columnDivider>
                    <TableCell.Column leading>
                        <TableCell.Label>{t('security.deviceDetails.status')}</TableCell.Label>
                    </TableCell.Column>
                    <TableCell.Column style={styles.statusColumn}>
                        <TableCell.Value color={statusColor(details.dataStatus)}>
                            {t(statusLabelKey(details.dataStatus))}
                        </TableCell.Value>
                        {isUnknown && (
                            <Text variant="bodyM" color="secondary">
                                {t('security.deviceDetails.unknownHint')}
                            </Text>
                        )}
                        {!isSynced && !isUnknown && (
                            <Text variant="bodyM" color="secondary">
                                {t('security.deviceDetails.completeSyncHint', {
                                    deviceName: details.meta.name
                                })}
                            </Text>
                        )}
                    </TableCell.Column>
                </TableCell>
                {!isUnknown && (
                    <TableCell columnDivider>
                        <TableCell.Column leading>
                            <TableCell.Label>
                                {isSynced
                                    ? t('security.deviceDetails.wallets')
                                    : t('security.deviceDetails.notOnThisDevice')}
                            </TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column style={styles.walletsColumn}>
                            {isSynced ? (
                                <TableCell.Value>
                                    {t('security.deviceDetails.allWallets')}
                                </TableCell.Value>
                            ) : (
                                details.pendingPortfolios.map(portfolio => (
                                    <PortfolioName
                                        key={portfolio.id.toString()}
                                        meta={portfolio.meta}
                                        fontVariant="bodyM"
                                        color="primary"
                                    />
                                ))
                            )}
                        </TableCell.Column>
                    </TableCell>
                )}
            </List.Group>
            {isSynced && (
                <Banner nonInteractive style={styles.fullAccessBanner}>
                    <Banner.Content>
                        <Banner.Text>{t('security.deviceDetails.fullAccess')}</Banner.Text>
                        <Icon icon={DeviceLink} />
                    </Banner.Content>
                </Banner>
            )}
        </List>
    );
};
