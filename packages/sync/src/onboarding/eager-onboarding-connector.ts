import type { ZodType } from 'zod';

import type { OnboardingConnector } from './connector';
import type { ISyncAccount } from '../account/I-sync-account';

export class EagerOnboardingConnector<
    S extends Record<string, ZodType>
> implements OnboardingConnector<S> {
    public readonly data: Buffer;

    private readonly abortController = new AbortController();
    private readonly completionPromise: Promise<ISyncAccount<S>>;
    private completed = false;

    constructor(
        data: Buffer,
        waitForCompletion: (signal: AbortSignal) => Promise<ISyncAccount<S>>,
        private readonly onComplete: () => void = () => undefined
    ) {
        this.data = data;
        this.completionPromise = waitForCompletion(this.abortController.signal).finally(() => {
            this.complete();
        });
        this.completionPromise.catch(() => undefined);
    }

    public waitForCompletion(): Promise<ISyncAccount<S>> {
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
