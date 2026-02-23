import { ITreeStorage } from '../di';

export class AppStorageFactory {
    private readonly prefix = 'app';

    private readonly storage: ITreeStorage;

    public readonly shared: ITreeStorage;

    constructor(storage: ITreeStorage) {
        this.storage = storage.child(this.prefix);

        this.shared = this.storage.child('shared');
    }

    public account(id: string) {
        return {
            local: this.storage.child(['account', id, 'local']),
            synced: this.storage.child(['account', id, 'synced'])
        };
    }
}
