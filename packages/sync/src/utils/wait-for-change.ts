export type WaitForChangeOptions = {
    subscribe: (observer: () => void) => () => void;
    predicate: () => boolean | Promise<boolean>;
    timeoutMs: number;
    timeoutError: () => Error;
    signal?: AbortSignal;
    abortError?: () => Error;
};

export async function waitForChange(opts: WaitForChangeOptions): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        let done = false;
        let unsubscribe: (() => void) | undefined;
        const abortError = opts.abortError ?? (() => new Error('Wait for change aborted'));

        const finish = (f: () => void) => {
            if (done) {
                return;
            }

            done = true;
            clearTimeout(timeout);
            opts.signal?.removeEventListener('abort', onAbort);
            unsubscribe?.();
            f();
        };

        const onAbort = () => {
            finish(() => reject(abortError()));
        };

        const check = () => {
            void Promise.resolve(opts.predicate()).then(
                matched => {
                    if (matched) {
                        finish(resolve);
                    }
                },
                error => finish(() => reject(normalizeError(error)))
            );
        };

        const timeout = setTimeout(() => {
            finish(() => reject(opts.timeoutError()));
        }, opts.timeoutMs);

        if (opts.signal?.aborted) {
            onAbort();
            return;
        }

        opts.signal?.addEventListener('abort', onAbort, { once: true });

        try {
            unsubscribe = opts.subscribe(check);
            check();
        } catch (error) {
            finish(() => reject(normalizeError(error)));
        }
    });
}

function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}
