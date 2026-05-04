export type StorageObserver = () => void;

export class StorageObservers {
  private readonly observers = new Set<StorageObserver>();

  add(observer: StorageObserver): void {
    this.observers.add(observer);
  }

  remove(observer: StorageObserver): void {
    this.observers.delete(observer);
  }

  notify(): void {
    for (const observer of this.observers) {
      observer();
    }
  }
}
