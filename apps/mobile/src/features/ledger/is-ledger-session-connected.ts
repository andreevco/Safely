import { type DeviceManagementKit, DeviceStatus } from '@ledgerhq/device-management-kit';
import { firstValueFrom } from 'rxjs';

export const isLedgerSessionConnected = async (
    dmk: DeviceManagementKit,
    sessionId: string
): Promise<boolean> => {
    try {
        const state = await firstValueFrom(dmk.getDeviceSessionState({ sessionId }));

        return state.deviceStatus !== DeviceStatus.NOT_CONNECTED;
    } catch {
        return false;
    }
};
