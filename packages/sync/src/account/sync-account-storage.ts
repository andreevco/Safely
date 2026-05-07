import type { ITreeStorage } from '../I-storage';

export function getSyncAccountStorage(storage: ITreeStorage, accountId: string) {
    return storage.child([accountId]);
}
