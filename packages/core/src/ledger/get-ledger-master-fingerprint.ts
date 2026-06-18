import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { SignerBtcBuilder } from '@ledgerhq/device-signer-kit-bitcoin';

import { awaitDeviceAction } from './await-device-action';

export const getLedgerMasterFingerprint = async (
    ledgerKit: DeviceManagementKit,
    sessionId: string
): Promise<string> => {
    const signer = new SignerBtcBuilder({ dmk: ledgerKit, sessionId }).build();

    const { masterFingerprint } = await awaitDeviceAction(
        signer.getMasterFingerprint({ skipOpenApp: true })
    );

    return Buffer.from(masterFingerprint).toString('hex');
};
