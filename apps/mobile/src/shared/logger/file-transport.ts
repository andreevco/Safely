import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import type { ILoggerTransport, LogEntry } from '@safely/sync';
import { LogLevel } from '@safely/sync';

// TODO IMPORT Find a way to keep on the app level
// eslint-disable-next-line boundaries/element-types
import { LOGGER_BUFFER_MOBILE_STORAGE_ONLY_APP_LEVEL_USE } from '@mobile/app/storage';

const FILENAME = 'safely.ndjson';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const CONTEXT_BUFFER_SIZE = 1000;
const CONTEXT_PREFIX = 'c_';
const FILE_PREFIX = 'f_';

type FileTransportConfig = {
    appVersion: string;
    build: string;
    deviceInfo: { name: string; osVersion: string };
};

type StoredLog = {
    t: string;
    l: LogLevel;
    p: string[];
    m: string;
    v: string;
    b: string;
    d: string;
};

export type LogRecord = {
    timestamp: string;
    level: LogLevel;
    path: string[];
    message: string;
    appVersion: string;
    build: string;
    device: string;
};

export class FileTransport implements ILoggerTransport {
    private readonly mmkv = LOGGER_BUFFER_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.mmkv;
    private readonly appVersion: string;
    private readonly build: string;
    private readonly device: string;
    private pending: Promise<void> | null = null;
    private seqNo = 0;
    private contextKeys: string[];

    constructor(opts: FileTransportConfig) {
        this.appVersion = opts.appVersion;
        this.build = opts.build;
        this.device = `${opts.deviceInfo.name}, ${opts.deviceInfo.osVersion}`;

        this.contextKeys = this.mmkv
            .getAllKeys()
            .filter(k => k.startsWith(CONTEXT_PREFIX))
            .sort();

        void this.flush();
    }

    public log(entry: LogEntry): void {
        const serialized = this.serialize(entry);

        if (entry.level < LogLevel.WARN) {
            this.pushContext(serialized);

            return;
        }

        if (entry.level >= LogLevel.ERROR) {
            this.promoteContext();
        }

        this.mmkv.set(this.nextKey(FILE_PREFIX), serialized);
        void this.flush();
    }

    public flush(): Promise<void> {
        if (!this.pending) {
            this.pending = Promise.resolve().then(() => {
                this.pending = null;
                this.doFlush();
            });
        }

        return this.pending;
    }

    public async share(): Promise<void> {
        await this.flush();

        const file = new File(Paths.cache, FILENAME);
        if (!file.exists) return;

        await shareAsync(file.uri, {
            mimeType: 'application/x-ndjson',
            dialogTitle: 'Share Safely Logs'
        });
    }

    private doFlush(): void {
        const lines: string[] = [];

        try {
            const keys = this.mmkv
                .getAllKeys()
                .filter(k => k.startsWith(FILE_PREFIX))
                .sort();
            if (keys.length === 0) return;

            for (const key of keys) {
                const line = this.mmkv.getString(key);
                if (line) lines.push(line);

                this.mmkv.remove(key);
            }
        } catch (e) {
            console.error('[FileTransport] failed to read buffered logs', e);

            return;
        }

        if (lines.length === 0) return;

        const content = lines.join('\n') + '\n';
        const logFile = new File(Paths.cache, FILENAME);

        try {
            if (logFile.exists && logFile.size > MAX_FILE_SIZE_BYTES) {
                logFile.delete();
            }
        } catch (e) {
            console.error('[FileTransport] failed to check/delete log file', e);
        }

        try {
            if (logFile.exists) {
                const handle = logFile.open();
                handle.offset = logFile.size;
                handle.writeBytes(new TextEncoder().encode(content));
                handle.close();
            } else {
                logFile.create();
                logFile.write(content);
            }
        } catch (e) {
            console.error('[FileTransport] failed to write logs', e);
        }
    }

    private pushContext(serialized: string): void {
        const key = this.nextKey(CONTEXT_PREFIX);
        this.mmkv.set(key, serialized);
        this.contextKeys.push(key);

        while (this.contextKeys.length > CONTEXT_BUFFER_SIZE) {
            const oldest = this.contextKeys.shift();
            if (oldest) this.mmkv.remove(oldest);
        }
    }

    private promoteContext(): void {
        for (const key of this.contextKeys) {
            const value = this.mmkv.getString(key);
            if (value) {
                this.mmkv.set(FILE_PREFIX + key.slice(CONTEXT_PREFIX.length), value);
            }

            this.mmkv.remove(key);
        }

        this.contextKeys = [];
    }

    public async read(): Promise<LogRecord[]> {
        await this.flush();

        const file = new File(Paths.cache, FILENAME);
        if (!file.exists) return [];

        try {
            return file
                .textSync()
                .split('\n')
                .map(parseLogLine)
                .filter((record): record is LogRecord => record !== null);
        } catch (e) {
            console.error('[FileTransport] failed to read log file', e);

            return [];
        }
    }

    private serialize(entry: LogEntry): string {
        const stored: StoredLog = {
            t: entry.timestamp.toISOString(),
            l: entry.level,
            p: entry.path,
            m: entry.message.map(serializeMessage).join(' '),
            v: this.appVersion,
            b: this.build,
            d: this.device
        };

        return JSON.stringify(stored);
    }

    private nextKey(prefix: string): string {
        return `${prefix}${Date.now()}_${String(this.seqNo++).padStart(6, '0')}`;
    }
}

function parseLogLine(line: string): LogRecord | null {
    if (!line) return null;

    try {
        const stored = JSON.parse(line) as StoredLog;

        return {
            timestamp: stored.t,
            level: stored.l,
            path: stored.p,
            message: stored.m,
            appVersion: stored.v,
            build: stored.b,
            device: stored.d
        };
    } catch {
        return null;
    }
}

function serializeMessage(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.stack ?? message.message;

    try {
        return JSON.stringify(message);
    } catch {
        return String(message);
    }
}
