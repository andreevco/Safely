import type { StorageVersion } from '@safely/slottree';

import type { Logger } from '../../logger';
import { OnboardingAbortedError } from '../../sync-error';
import {
    SyncMachineRunAbortedError,
    SyncMachineRunResult,
    SyncMachineRunTimeoutError
} from '../../sync-machine/run-result';
import type { OnlineSyncProvider } from '../../sync-provider/online-sync-provider';
import { abortableDelay } from '../../utils/abortable-delay';
import { QRMessageCodec, QRMessageOperation } from '../onboarding-codec';

const MAX_RECONNECT_ATTEMPTS = 150;

export class ReconnectOnboarding<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly myIkPub: Buffer,
        private readonly syncProvider: OnlineSyncProvider<Latest, Rest>,
        private readonly logger: Logger,
        private readonly pollingTimeout: number,
        private readonly storageVersion: number,
        private readonly devicesStorageVersion: number
    ) {}

    public generateOnboardingData(): Buffer {
        return QRMessageCodec.encode({
            type: QRMessageOperation.RECONNECTION,
            ikPub: this.myIkPub,
            storageVersion: this.storageVersion,
            devicesStorageVersion: this.devicesStorageVersion
        });
    }

    public async waitForOnboarding(signal?: AbortSignal): Promise<void> {
        const deadline = Date.now() + this.pollingTimeout * MAX_RECONNECT_ATTEMPTS;

        for (let i = 0; Date.now() < deadline; i++) {
            if (signal?.aborted) {
                throw new OnboardingAbortedError();
            }

            this.syncProvider.restart({ preserveStatus: true });

            let result: SyncMachineRunResult;
            try {
                result = await this.syncProvider.waitForCurrentRunResult({
                    timeout: 30_000,
                    signal
                });
            } catch (e) {
                if (e instanceof SyncMachineRunTimeoutError) {
                    this.logger.info('Trying to reconnect, attempt', i + 1);
                    continue;
                }

                if (e instanceof SyncMachineRunAbortedError) {
                    throw new OnboardingAbortedError();
                }

                throw e;
            }

            if (result === SyncMachineRunResult.SYNCHRONIZED) {
                return;
            }

            this.logger.info('Trying to reconnect, attempt', i + 1);
            await this.waitBeforeRetry(1000, signal);
        }
        throw new Error('Onboarding timed out');
    }

    private async waitBeforeRetry(timeoutMs: number, signal?: AbortSignal): Promise<void> {
        await abortableDelay(timeoutMs, {
            signal,
            abortError: () => new OnboardingAbortedError()
        });
    }
}
