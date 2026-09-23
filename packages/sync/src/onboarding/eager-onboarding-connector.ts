import type { StorageVersion } from '@safely/slottree';

import type { OnboardedAccount, OnboardingConnector } from './connector';

export class EagerOnboardingConnector<
    Latest extends StorageVersion
> implements OnboardingConnector<Latest> {
    public readonly data: Buffer;

    private readonly abortController = new AbortController();
    private readonly completionPromise: Promise<OnboardedAccount<Latest>>;
    private completed = false;

    constructor(
        data: Buffer,
        waitForCompletion: (signal: AbortSignal) => Promise<OnboardedAccount<Latest>>,
        private readonly onComplete: () => void = () => undefined
    ) {
        this.data = data;
        this.completionPromise = waitForCompletion(this.abortController.signal).finally(() => {
            this.complete();
        });
        this.completionPromise.catch(() => undefined);
    }

    public waitForCompletion(): Promise<OnboardedAccount<Latest>> {
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
