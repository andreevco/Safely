import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { SignerBtcBuilder } from '@ledgerhq/device-signer-kit-bitcoin';

import { awaitDeviceAction } from './await-device-action';

export const getLedgerMasterFingerprint = async (
    dmk: DeviceManagementKit,
    sessionId: string
): Promise<string> => {
    const signer = new SignerBtcBuilder({ dmk, sessionId }).build();

    const { masterFingerprint } = await awaitDeviceAction(
        signer.getMasterFingerprint({ skipOpenApp: true })
    );

    return Buffer.from(masterFingerprint).toString('hex');
};
