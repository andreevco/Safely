import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';

export interface LedgerTransport {
    createKit(): DeviceManagementKit;
    transportIdentifier: string;
}
