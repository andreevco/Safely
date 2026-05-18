import type { StorageVersion } from '@safely/slottree';

import type { Logger } from '../../logger';
import { OnboardingAbortedError } from '../../sync-error';
import type { OnlineSyncProvider } from '../../sync-provider/online-sync-provider';
import { SyncStatus, SyncStatusTimeoutError } from '../../sync-provider/sync-status';
import { QRMessageCodec, QRMessageOperation } from '../onboarding-codec';

export class ReconnectOnboarding<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly myIkPub: Buffer,
        private readonly syncProvider: OnlineSyncProvider<Latest, Rest>,
        private readonly logger: Logger,
        private readonly pollingTimeout: number
    ) {}

    public generateOnboardingData(): Buffer {
        return QRMessageCodec.encode({
            type: QRMessageOperation.RECONNECTION,
            ikPub: this.myIkPub
        });
    }

    public async waitForOnboarding(signal?: AbortSignal): Promise<void> {
        for (let i = 0; i < 30; i++) {
            if (signal?.aborted) {
                throw new OnboardingAbortedError();
            }

            this.syncProvider.restart({ preserveStatus: true });

            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, this.pollingTimeout);
                signal?.addEventListener(
                    'abort',
                    () => {
                        clearTimeout(timer);
                        reject(new OnboardingAbortedError());
                    },
                    { once: true }
                );
            });

            let synchronized: boolean;
            try {
                synchronized = await this.syncProvider.syncStatusManager
                    .waitForStatus(SyncStatus.SYNCHRONIZED, { timeout: 1000 })
                    .then(() => true);
            } catch (e) {
                if (isSyncStatusTimeoutError(e)) {
                    this.logger.info('Trying to reconnect, attempt', i + 1);
                    continue;
                } else {
                    throw e;
                }
            }
            if (synchronized) {
                return;
            } else {
                this.logger.info('Trying to reconnect, attempt', i + 1);
            }
        }
        throw new Error('Onboarding timed out');
    }
}

function isSyncStatusTimeoutError(error: unknown): boolean {
    if (error instanceof SyncStatusTimeoutError) {
        return true;
    }

    return (
        error instanceof AggregateError &&
        error.errors.every((innerError: unknown) => innerError instanceof SyncStatusTimeoutError)
    );
}
