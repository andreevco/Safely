export type AbortableDelayOptions = {
    signal?: AbortSignal;
    abortError?: () => Error;
};

export async function abortableDelay(
    timeoutMs: number,
    opts: AbortableDelayOptions = {}
): Promise<void> {
    if (timeoutMs <= 0) {
        return;
    }

    const abortError = opts.abortError ?? (() => new Error('Delay aborted'));
    if (opts.signal?.aborted) {
        throw abortError();
    }

    await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            clearTimeout(timer);
            opts.signal?.removeEventListener('abort', onAbort);
        };
        const onAbort = () => {
            cleanup();
            reject(abortError());
        };
        const timer = setTimeout(() => {
            cleanup();
            resolve();
        }, timeoutMs);

        opts.signal?.addEventListener('abort', onAbort, { once: true });
    });
}
