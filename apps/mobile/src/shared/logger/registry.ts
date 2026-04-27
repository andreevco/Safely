import { Directory, File, Paths } from 'expo-file-system';

import { Logger, LoggerLifecycleContext } from '@safely/sync';
import { ILoggerRegistry } from '@safely/ux';

import { buildLogger } from './build-logger';
import { FileTransport } from './file-transport';
import { accountLogHash, ACCOUNT_FILE_PATTERN } from './naming';
import { shareAggregatedLogs } from './share-logs';

type AccountEntry = {
    logger: Logger;
    transport: FileTransport;
};

export type LoggerRegistryOpts = {
    isDev: boolean;
    systemTransport: FileTransport;
    createAccountTransport: (accountId: string) => FileTransport;
};

export class LoggerRegistry implements ILoggerRegistry {
    public readonly systemLogger: Logger;
    private readonly accounts = new Map<string, AccountEntry>();

    constructor(private readonly opts: LoggerRegistryOpts) {
        this.systemLogger = buildLogger(opts.systemTransport, opts.isDev);
    }

    public getAccountLogger(accountId: string): Logger {
        const existing = this.accounts.get(accountId);
        if (existing) return existing.logger;

        const transport = this.opts.createAccountTransport(accountId);
        const logger = buildLogger(transport, this.opts.isDev);
        this.accounts.set(accountId, { logger, transport });

        return logger;
    }

    public async onAfterAppOpened(ctx: LoggerLifecycleContext): Promise<void> {
        const validHashes = new Set(ctx.accountIds.map(accountLogHash));

        const unusedIds = Array.from(this.accounts.keys()).filter(
            id => !validHashes.has(accountLogHash(id))
        );
        await Promise.all(
            unusedIds.map(async id => {
                const entry = this.accounts.get(id);
                if (!entry) return;

                this.accounts.delete(id);
                await entry.transport.destroy();
            })
        );

        let files: string[];
        try {
            files = new Directory(Paths.document).list().map(item => item.name);
        } catch (e) {
            this.systemLogger.error('[LoggerRegistry] onAfterAppOpened: list failed', e);
            return;
        }

        for (const name of files) {
            const match = ACCOUNT_FILE_PATTERN.exec(name);
            if (!match) continue;

            const hash = match[1];
            if (validHashes.has(hash)) continue;

            try {
                new File(Paths.document, name).delete();
            } catch (e) {
                this.systemLogger.error(
                    '[LoggerRegistry] onAfterAppOpened: delete failed',
                    name,
                    e
                );
            }
        }
    }

    public async onBeforeAppClosed(_ctx: LoggerLifecycleContext): Promise<void> {
        await this.flushAll();
    }

    public async shareAllLogs(): Promise<void> {
        await this.flushAll();
        await shareAggregatedLogs({
            systemFilename: this.opts.systemTransport.filename,
            logger: this.systemLogger
        });
    }

    private async flushAll(): Promise<void> {
        await Promise.all([
            this.opts.systemTransport.flush(),
            ...Array.from(this.accounts.values()).map(({ transport }) => transport.flush())
        ]);
    }
}
