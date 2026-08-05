import type { SyncedDeviceDetails } from '@safely/ux';
import { SyncedDeviceDataStatus } from '@safely/ux';

import type { TextProps } from '@mobile/shared/ui';

type DeviceRowStatus = {
    labelKey: string;
    color: TextProps['color'];
};

function isHealthyPair(devices: SyncedDeviceDetails[]): boolean {
    return (
        devices.length === 2 &&
        devices.every(d => !d.isStale && d.dataStatus === SyncedDeviceDataStatus.SYNCED)
    );
}

export function resolveDeviceRowStatus(
    device: SyncedDeviceDetails,
    devices: SyncedDeviceDetails[]
): DeviceRowStatus {
    if (device.isStale) {
        return { labelKey: 'security.device.status.staleConnection', color: 'accentRed' };
    }

    if (device.dataStatus === SyncedDeviceDataStatus.NOT_SYNCED) {
        return { labelKey: 'security.device.status.notSynced', color: 'accentRed' };
    }

    if (device.dataStatus === SyncedDeviceDataStatus.UNKNOWN) {
        return { labelKey: 'security.device.status.unknown', color: 'accentOrange' };
    }

    if (!isHealthyPair(devices)) {
        return { labelKey: 'security.device.status.synced', color: 'secondary' };
    }

    return {
        labelKey: device.isCurrent
            ? 'security.device.status.upToDate'
            : 'security.device.status.essentialDataSynced',
        color: 'secondary'
    };
}
