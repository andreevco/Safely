import { Logger, LoggerLifecycleContext } from '@safely/sync';
import { ILoggerRegistry } from '@safely/ux';

import { buildLogger } from './build-logger';
import { FileTransport } from './file-transport';
import { accountLogHash } from './naming';
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
    private activeAccountId: string | null = null;

    constructor(private readonly opts: LoggerRegistryOpts) {
        this.systemLogger = buildLogger(opts.systemTransport, opts.isDev);
    }

    public get activeLogger(): Logger {
        return this.activeAccountId
            ? this.getAccountLogger(this.activeAccountId)
            : this.systemLogger;
    }

    public setActiveAccountId(accountId: string | null): void {
        this.activeAccountId = accountId;
    }

    public getAccountLogger(accountId: string): Logger {
        const existing = this.accounts.get(accountId);
        if (existing) return existing.logger;

        const transport = this.opts.createAccountTransport(accountId);
        const logger = buildLogger(transport, this.opts.isDev);
        this.accounts.set(accountId, { logger, transport });

        return logger;
    }

    public async onAccountsChanged(ctx: LoggerLifecycleContext): Promise<void> {
        const validHashes = new Set(ctx.accountIds.map(accountLogHash));

        const unusedIds = Array.from(this.accounts.keys()).filter(
            id => !validHashes.has(accountLogHash(id))
        );

        for (const id of unusedIds) {
            const entry = this.accounts.get(id);
            if (!entry) continue;

            this.accounts.delete(id);
            entry.transport.destroy();
        }

        FileTransport.clearMissedLogFiles(validHashes, this.systemLogger);
    }

    public async onBeforeAppClosed(): Promise<void> {
        await this.flushAll();
    }

    public async shareLogs(opts?: { accountId?: string }): Promise<void> {
        await this.flushAll();

        const systemFilename = this.opts.systemTransport.filename;
        const accountFilename = opts?.accountId
            ? this.accounts.get(opts.accountId)?.transport.filename
            : undefined;

        await shareAggregatedLogs({
            systemFilename,
            accountFilename,
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
