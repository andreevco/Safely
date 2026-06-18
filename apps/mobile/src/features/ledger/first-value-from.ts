type Subscription = { unsubscribe: () => void };

type Subscribable<T> = {
    subscribe(observer: {
        next: (value: T) => void;
        error: (error: unknown) => void;
        complete: () => void;
    }): Subscription;
};

export const firstValueFrom = <T>(source: Subscribable<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const state: { settled: boolean; subscription?: Subscription } = { settled: false };

        const settle = (run: () => void) => {
            if (state.settled) return;
            state.settled = true;
            run();
            state.subscription?.unsubscribe();
        };

        state.subscription = source.subscribe({
            next: value => settle(() => resolve(value)),
            error: error =>
                settle(() =>
                    reject(error instanceof Error ? error : new Error('Observable errored'))
                ),
            complete: () =>
                settle(() => reject(new Error('Observable completed without emitting a value')))
        });

        if (state.settled) state.subscription.unsubscribe();
    });
