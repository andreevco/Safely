import type { SyncedDeviceDetails } from '@safely/ux';
import { SyncedDeviceDataStatus } from '@safely/ux';

import type { TextProps } from '@mobile/shared/ui';

type DeviceRowStatus = {
    labelKey: string;
    color: TextProps['color'];
};

export function resolveDeviceRowStatus(device: SyncedDeviceDetails): DeviceRowStatus {
    if (device.archive !== null) {
        return { labelKey: 'security.device.status.archived', color: 'secondary' };
    }

    if (device.isStale) {
        return { labelKey: 'security.device.status.staleConnection', color: 'accentRed' };
    }

    if (device.dataStatus === SyncedDeviceDataStatus.NOT_SYNCED) {
        return { labelKey: 'security.device.status.notSynced', color: 'accentRed' };
    }

    if (device.dataStatus === SyncedDeviceDataStatus.UNKNOWN) {
        return { labelKey: 'security.device.status.unknown', color: 'accentOrange' };
    }

    return { labelKey: 'security.device.status.synced', color: 'secondary' };
}
