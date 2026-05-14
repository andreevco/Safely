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

export class ReconnectOnboardingCoordinator<S extends Record<string, ZodType>> {
    private activeConnector: OnboardingConnector<S> | null = null;
    private activeConnectorPromise: Promise<OnboardingConnector<S>> | null = null;

    constructor(
        private readonly account: ISyncAccount<S>,
        private readonly getSyncProvider: () => ISyncProvider<S>,
        private readonly ikService: IkService,
        private readonly deviceManager: DeviceManagementService,
        private readonly logger: Logger
    ) {}

    public async getConnector(): Promise<OnboardingConnector<S>> {
        if (this.activeConnector) {
            return this.activeConnector;
        }

        if (this.activeConnectorPromise) {
            return await this.activeConnectorPromise;
        }

        const connectorPromise = this.createConnector();
        this.activeConnectorPromise = connectorPromise;
        try {
            return await connectorPromise;
        } catch (error) {
            if (this.activeConnectorPromise === connectorPromise) {
                this.activeConnectorPromise = null;
            }
            throw error;
        }
    }

    private async createConnector(): Promise<OnboardingConnector<S>> {
        await this.ensureDeviceCanReconnect();

        const onboarding = new ReconnectOnboarding(
            await this.ikService.getPub(),
            this.getSyncProvider() as OnlineSyncProvider<S>,
            this.logger
        );
        const connector = new ReconnectOnboardingConnector(onboarding, this.account, () => {
            this.clearConnector(connector);
        });

        this.activeConnector = connector;
        this.activeConnectorPromise = null;
        return connector;
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

    private clearConnector(connector: OnboardingConnector<S>): void {
        if (this.activeConnector === connector) {
            this.activeConnector = null;
        }
    }
}

class ReconnectOnboardingConnector<
    S extends Record<string, ZodType>
> implements OnboardingConnector<S> {
    public readonly data: Buffer;

    private readonly abortController = new AbortController();
    private readonly completionPromise: Promise<ISyncAccount<S>>;

    constructor(
        private readonly onboarding: ReconnectOnboarding<S>,
        private readonly account: ISyncAccount<S>,
        private readonly onComplete: () => void
    ) {
        this.data = onboarding.generateOnboardingData();
        this.completionPromise = this.onboarding
            .waitForOnboarding(this.abortController.signal)
            .then(() => this.account)
            .finally(() => {
                this.onComplete();
            });
        this.completionPromise.catch(() => undefined);
    }

    public waitForCompletion(): Promise<ISyncAccount<S>> {
        return this.completionPromise;
    }

    public abort(): void {
        this.abortController.abort();
        this.onComplete();
    }
}
