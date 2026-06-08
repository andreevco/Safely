import type { Logger } from '@safely/sync';

import type { IEnumerableStorage } from '../di';

export class LoggableStorage implements IEnumerableStorage {
    private readonly logger: Logger;

    constructor(
        private readonly storage: IEnumerableStorage,
        logger: Logger,
        label: string
    ) {
        this.logger = logger.child(label);
    }

    public getItem(key: string): Promise<string | null> {
        this.logger.info('called "getItem" for key', `"${key}"`, this.captureStack());
        return this.storage.getItem(key);
    }

    public setItem(key: string, value: string): Promise<void> {
        this.logger.info('called "setItem" for key', `"${key}"`, this.captureStack());
        return this.storage.setItem(key, value);
    }

    public removeItem(key: string): Promise<void> {
        this.logger.info('called "removeItem" for key', `"${key}"`, this.captureStack());
        return this.storage.removeItem(key);
    }

    public clear(): Promise<void> {
        this.logger.info('called "clear"', this.captureStack());
        return this.storage.clear();
    }

    public getAllKeys(): Promise<string[]> {
        this.logger.info('called "getAllKeys"', this.captureStack());
        return this.storage.getAllKeys();
    }

    public getKeysWithPrefix(prefix: string): Promise<string[]> {
        this.logger.info(
            'called "getKeysWithPrefix" with prefix',
            `"${prefix}"`,
            this.captureStack()
        );
        return this.storage.getKeysWithPrefix(prefix);
    }

    public removeItemsWithPrefix(prefix: string): Promise<void> {
        this.logger.info('removeItemsWithPrefix', `"${prefix}"`, this.captureStack());
        return this.storage.removeItemsWithPrefix(prefix);
    }

    private captureStack(): string {
        const raw = new Error().stack ?? '';
        const lines = raw.split('\n');
        // Drop the leading "Error" line and the two top frames
        // (captureStack itself + the LoggableStorage method that called it),
        // so the first remaining frame is the external caller.
        const callerFrames = lines.slice(1).filter(line => line.trim().startsWith('at '));
        return `\n${callerFrames.slice(2).join('\n')}`;
    }
}
