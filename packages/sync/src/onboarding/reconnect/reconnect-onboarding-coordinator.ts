import type { ZodType } from 'zod';

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

export class ReconnectOnboardingCoordinator<S extends Record<string, ZodType>> {
    private readonly coordinator = new SingleActiveOnboardingCoordinator<S>();

    constructor(
        private readonly account: ISyncAccount<S>,
        private readonly getSyncProvider: () => ISyncProvider<S>,
        private readonly ikService: IkService,
        private readonly deviceManager: DeviceManagementService,
        private readonly logger: Logger
    ) {}

    public async getConnector(): Promise<OnboardingConnector<S>> {
        return await this.coordinator.getConnector(() => this.createSession());
    }

    private async createSession() {
        await this.ensureDeviceCanReconnect();

        const onboarding = new ReconnectOnboarding(
            await this.ikService.getPub(),
            this.getSyncProvider() as OnlineSyncProvider<S>,
            this.logger
        );

        return {
            data: onboarding.generateOnboardingData(),
            waitForCompletion: async (signal: AbortSignal) => {
                await onboarding.waitForOnboarding(signal);
                return this.account;
            }
        };
    }

    private async ensureDeviceCanReconnect(): Promise<void> {
        if (this.getSyncProvider().syncStatusManager.getStatus() === SyncStatus.DEVICE_DELETED) {
            return;
        }

        const deviceList = await this.deviceManager.getDevices();
        const myIkPub = await this.ikService.getPub();
        const isMyDeviceInList = deviceList.some(device => device.ikPub.equals(myIkPub));
        if (isMyDeviceInList) {
            throw new SyncError('Device was not deleted');
        }
    }
}
