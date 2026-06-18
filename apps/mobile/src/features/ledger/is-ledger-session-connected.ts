import {
    type DeviceManagementKit,
    type DeviceSessionState,
    DeviceStatus
} from '@ledgerhq/device-management-kit';

import { firstValueFrom } from './first-value-from';

export const isLedgerSessionConnected = async (
    dmk: DeviceManagementKit,
    sessionId: string
): Promise<boolean> => {
    try {
        const state = await firstValueFrom<DeviceSessionState>(
            dmk.getDeviceSessionState({ sessionId })
        );

        return state.deviceStatus !== DeviceStatus.NOT_CONNECTED;
    } catch {
        return false;
    }
};
