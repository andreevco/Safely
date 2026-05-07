import type { ZodType } from 'zod';

import type { Logger } from '../../logger';
import { OnboardingAbortedError } from '../../sync-error';
import type { OnlineSyncProvider } from '../../sync-provider/online-sync-provider';
import { SyncStatus } from '../../sync-provider/sync-status';
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

            this.syncProvider.restart();

            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, 1000);
                signal?.addEventListener(
                    'abort',
                    () => {
                        clearTimeout(timer);
                        reject(new OnboardingAbortedError());
                    },
                    { once: true }
                );
            });

            const synchronized = await Promise.any([
                this.syncProvider.syncStatusManager
                    .waitForStatus(SyncStatus.SYNCHRONIZED)
                    .then(() => true),
                this.syncProvider.syncStatusManager
                    .waitForStatus(SyncStatus.DEVICE_DELETED)
                    .then(() => false)
            ]);
            if (synchronized) {
                return;
            } else {
                this.logger.info('Trying to reconnect, attempt', i + 1);
            }
        }
        throw new Error('Onboarding timed out');
    }
}
