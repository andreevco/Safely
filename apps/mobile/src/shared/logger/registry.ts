import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Logger } from '@safely/sync';
import { ILoggerRegistry } from '@safely/ux';

import { accountLogHash } from './account-hash';
import { FileTransport } from './file-transport';
import { createAccountLoggerInstance, LoggerBundle, MobileLoggerConfig } from './logger';
import { ACCOUNT_FILE_PATTERN } from './naming';

type LoggerRegistryOpts = {
    config: MobileLoggerConfig;
    systemLogger: Logger;
    systemTransport: FileTransport;
};

export class LoggerRegistry implements ILoggerRegistry {
    public readonly systemLogger: Logger;
    private readonly accounts = new Map<string, LoggerBundle>();

    constructor(private readonly opts: LoggerRegistryOpts) {
        this.systemLogger = opts.systemLogger;
    }

    public getAccountLogger(accountId: string): Logger {
        const existing = this.accounts.get(accountId);
        if (existing) return existing.logger;

        const entry = createAccountLoggerInstance(accountId, this.opts.config);
        this.accounts.set(accountId, entry);

        return entry.logger;
    }

    public async destroyAccountLogger(accountId: string): Promise<void> {
        const entry = this.accounts.get(accountId);
        if (!entry) return;

        this.accounts.delete(accountId);
        await entry.transport.destroy();
    }

    public async destroyAllLogs(): Promise<void> {
        const entries = Array.from(this.accounts.values());

        this.accounts.clear();
        await Promise.all(entries.map(e => e.transport.destroy()));
        await this.opts.systemTransport.clear();
    }

    public async keepOnlyAccountLogs(activeAccountIds: string[]): Promise<void> {
        const keepHashes = new Set(activeAccountIds.map(accountLogHash));

        let files: string[];
        try {
            const dir = new Directory(Paths.document);
            files = dir.list().map(item => item.name);
        } catch (e) {
            this.systemLogger.error('[LoggerRegistry] keepOnlyAccountLogs: list failed', e);
            return;
        }

        for (const name of files) {
            const match = ACCOUNT_FILE_PATTERN.exec(name);
            if (!match) continue;

            const hash = match[1];
            if (keepHashes.has(hash)) continue;

            try {
                new File(Paths.document, name).delete();
            } catch (e) {
                this.systemLogger.error(
                    '[LoggerRegistry] keepOnlyAccountLogs: delete failed',
                    name,
                    e
                );
            }
        }
    }

    public async shareAllLogs(): Promise<void> {
        await this.opts.systemTransport.flush();
        await Promise.all(
            Array.from(this.accounts.values()).map(({ transport }) => transport.flush())
        );

        const aggregate = new File(Paths.cache, `safely-logs-${Date.now()}.ndjson`);
        try {
            aggregate.create();
            aggregate.write(section('system'));
            this.appendFileIfExists(aggregate, this.opts.systemTransport.filename);

            let files: string[] = [];
            try {
                files = new Directory(Paths.document).list().map(item => item.name);
            } catch {
                // directory may not exist
            }

            for (const name of files.filter(n => ACCOUNT_FILE_PATTERN.test(n))) {
                const match = ACCOUNT_FILE_PATTERN.exec(name);
                if (!match) continue;

                appendText(aggregate, section(`account-${match[1]}`));
                this.appendFileIfExists(aggregate, name);
            }

            await Sharing.shareAsync(aggregate.uri, {
                mimeType: 'application/x-ndjson',
                dialogTitle: 'Share Safely Logs'
            });
        } catch (e) {
            this.systemLogger.error('[LoggerRegistry] shareAllLogs failed', e);
        }
    }

    private appendFileIfExists(target: File, filename: string): void {
        try {
            const source = new File(Paths.document, filename);
            if (!source.exists) return;

            const bytes = source.bytesSync();
            const handle = target.open();
            handle.offset = target.size;
            handle.writeBytes(bytes);
            handle.close();
        } catch (e) {
            this.systemLogger.error('[LoggerRegistry] appendFile failed', filename, e);
        }
    }
}

function section(name: string): string {
    return JSON.stringify({ _section: name, t: new Date().toISOString() }) + '\n';
}

function appendText(target: File, text: string): void {
    const handle = target.open();
    handle.offset = target.size;
    handle.writeBytes(new TextEncoder().encode(text));
    handle.close();
}
