export type StorageObserver = () => void;

export class StorageObservers {
    private readonly observers = new Set<StorageObserver>();

    public add(observer: StorageObserver): void {
        this.observers.add(observer);
    }

    public remove(observer: StorageObserver): void {
        this.observers.delete(observer);
    }

    public notify(): void {
        for (const observer of this.observers) {
            observer();
        }
    }
}
