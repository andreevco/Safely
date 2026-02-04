import * as Y from 'yjs';

import { DeviceOp, deviceOpIsEquals, DeviceOpSchema } from './y-manager';
import { DeviceManagementService } from '../device-manager/device-management-service';

export class StorageVerifierService {
    constructor(private readonly deviceManager: DeviceManagementService) {}

    public async verifyUpdate(local: Y.Doc, remote: Y.Doc): Promise<VerifyResult> {
        await this.verifyDevicesOps(local, remote);

        return {
            newDeviceOps: this.getNewDeviceOps(local, remote)
        };
    }

    private async verifyDevicesOps(local: Y.Doc, remote: Y.Doc): Promise<void> {
        const localOps = getDeviceLog(local);
        const remoteOps = getDeviceLog(remote);

        if (remoteOps.length < localOps.length) {
            throw new Error(
                `Device logs have different length: [local ${localOps.length}] vs [remote ${remoteOps.length}]`
            );
        }

        for (let i = 0; i < localOps.length; i++) {
            const localOp = localOps[i];
            const remoteOp = remoteOps[i];
            if (!deviceOpIsEquals(localOp, remoteOp)) {
                throw new Error('Device logs differ');
            }
        }
        for (let i = localOps.length; i < remoteOps.length; i += 1) {
            await this.deviceManager.verifyDeviceOpSignature(remoteOps[i]);
        }
    }

    private getNewDeviceOps(local: Y.Doc, remote: Y.Doc): DeviceOp[] {
        const localOps = getDeviceLog(local);
        const remoteOps = getDeviceLog(remote);
        const newOps: DeviceOp[] = [];
        for (let i = localOps.length; i < remoteOps.length; i++) {
            newOps.push(remoteOps[i]);
        }
        return newOps;
    }
}

export type VerifyResult = {
    newDeviceOps: DeviceOp[];
};

function getDeviceLog(doc: Y.Doc): DeviceOp[] {
    const deviceLog = doc.getArray('devices');
    return deviceLog.toArray().map(x => DeviceOpSchema.parse(JSON.parse(<string>x)));
}
