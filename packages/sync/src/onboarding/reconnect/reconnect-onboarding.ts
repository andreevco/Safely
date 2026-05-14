import type { ZodType } from 'zod';

import type { Logger } from '../../logger';
import { OnboardingAbortedError } from '../../sync-error';
import type { OnlineSyncProvider } from '../../sync-provider/online-sync-provider';
import { SyncStatus, SyncStatusTimeoutError } from '../../sync-provider/sync-status';
import { QRMessageCodec, QRMessageOperation } from '../onboarding-codec';

export class ReconnectOnboarding<S extends Record<string, ZodType>> {
    constructor(
        private readonly myIkPub: Buffer,
        private readonly syncProvider: OnlineSyncProvider<S>,
        private readonly logger: Logger
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
                const timer = setTimeout(resolve, 3000);
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
                synchronized = await Promise.any([
                    this.syncProvider.syncStatusManager
                        .waitForStatus(SyncStatus.SYNCHRONIZED, { timeout: 1000 })
                        .then(() => true),
                    this.syncProvider.syncStatusManager
                        .waitForStatus(SyncStatus.DEVICE_DELETED, { timeout: 1000 })
                        .then(() => false)
                ]);
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
