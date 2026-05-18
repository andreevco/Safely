export class SyncOperationQueue {
    private current: Promise<void> = Promise.resolve();

    public run<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.current.then(operation, operation);
        this.current = result.then(
            () => undefined,
            () => undefined
        );
        return result;
    }

    public async drain(): Promise<void> {
        await this.current;
    }
}
