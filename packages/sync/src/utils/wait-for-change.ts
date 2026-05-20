export type WaitForChangeOptions = {
    subscribe: (observer: () => void) => () => void;
    predicate: () => boolean | Promise<boolean>;
    timeoutMs: number;
    timeoutError: () => Error;
};

export async function waitForChange(opts: WaitForChangeOptions): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        let done = false;
        let unsubscribe: (() => void) | undefined;

        const finish = (f: () => void) => {
            if (done) {
                return;
            }

            done = true;
            clearTimeout(timeout);
            unsubscribe?.();
            f();
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
