import type { StorageVersion } from '@safely/slottree';

import type { OnboardingConnector } from './connector';
import type { ISyncAccount } from '../account/I-sync-account';

export class EagerOnboardingConnector<
    Latest extends StorageVersion
> implements OnboardingConnector<Latest> {
    public readonly data: Buffer;

    private readonly abortController = new AbortController();
    private readonly completionPromise: Promise<ISyncAccount<Latest>>;
    private completed = false;

    constructor(
        data: Buffer,
        waitForCompletion: (signal: AbortSignal) => Promise<ISyncAccount<Latest>>,
        private readonly onComplete: () => void = () => undefined
    ) {
        this.data = data;
        this.completionPromise = waitForCompletion(this.abortController.signal).finally(() => {
            this.complete();
        });
        this.completionPromise.catch(() => undefined);
    }

    public waitForCompletion(): Promise<ISyncAccount<Latest>> {
        return this.completionPromise;
    }

    public abort(): void {
        this.abortController.abort();
        this.complete();
    }

    private complete(): void {
        if (this.completed) {
            return;
        }

        this.completed = true;
        this.onComplete();
    }
}
