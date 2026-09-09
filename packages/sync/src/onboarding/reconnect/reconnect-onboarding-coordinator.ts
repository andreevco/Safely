import type { NewOf, StorageVersion } from '@safely/slottree';

import { ReconnectOnboarding } from './reconnect-onboarding';
import type { ISyncAccount } from '../../account/I-sync-account';
import type { IkService } from '../../crypto/service/ik-service';
import type { DeviceManagementService } from '../../device-manager/device-management-service';
import type { Logger } from '../../logger';
import { SyncError } from '../../sync-error';
import type { ISyncProvider } from '../../sync-provider/I-sync-provider';
import type { OnlineSyncProvider } from '../../sync-provider/online-sync-provider';
import { SyncStatus } from '../../sync-provider/sync-status';
import type { OnboardingConnector } from '../connector';
import { SingleActiveOnboardingCoordinator } from '../single-active-onboarding-coordinator';

export class ReconnectOnboardingCoordinator<Latest extends StorageVersion, Rest> {
    private readonly coordinator = new SingleActiveOnboardingCoordinator<Latest>();

    constructor(
        private readonly account: ISyncAccount<Latest>,
        private readonly getSyncProvider: () => ISyncProvider<NewOf<Latest>>,
        private readonly ikService: IkService,
        private readonly deviceManager: DeviceManagementService,
        private readonly logger: Logger,
        private readonly pollingTimeout: number,
        private readonly storageVersion: number,
        private readonly devicesStorageVersion: number
    ) {}

    public async getConnector(): Promise<OnboardingConnector<Latest>> {
        return await this.coordinator.getConnector(() => this.createSession());
    }

    private async createSession() {
        await this.ensureDeviceCanReconnect();

        const onboarding = new ReconnectOnboarding(
            this.ikService.getPub(),
            this.getSyncProvider() as OnlineSyncProvider<Latest, Rest>,
            this.logger,
            this.pollingTimeout,
            this.storageVersion,
            this.devicesStorageVersion
        );

        return {
            data: onboarding.generateOnboardingData(),
            waitForCompletion: async (signal: AbortSignal) => {
                await onboarding.waitForOnboarding(signal);
                return { account: this.account, inviterIkPub: null };
            }
        };
    }

    private async ensureDeviceCanReconnect(): Promise<void> {
        if (this.getSyncProvider().syncStatusManager.getStatus() === SyncStatus.DEVICE_DELETED) {
            return;
        }

        const deviceList = await this.deviceManager.getDevices();
        const myIkPub = this.ikService.getPub();
        const isMyDeviceInList = deviceList.some(device => device.info.ikPub.equals(myIkPub));
        if (isMyDeviceInList) {
            throw new SyncError('Device was not deleted');
        }
    }
}
