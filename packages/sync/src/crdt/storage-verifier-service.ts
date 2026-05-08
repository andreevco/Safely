import { StorageVersion } from '@safely/slottree';

import { YCRDT } from './y-crdt';
import { DeviceManagementService } from '../device-manager/device-management-service';

export class StorageVerifierService<_Latest extends StorageVersion, _Rest> {
    constructor(private readonly deviceManager: DeviceManagementService) {}

    public async verifyUpdate<T extends object>(
        _local: YCRDT<T>,
        _remote: YCRDT<T>
    ): Promise<VerifyResult> {
        void this.deviceManager;

        return {};
    }
}

export type VerifyResult = Record<string, never>;
