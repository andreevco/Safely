import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import type { ILoggerTransport, LogEntry } from '@safely/sync';
import { LogLevel } from '@safely/sync';

const FILENAME = 'safely.ndjson';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const CONTEXT_BUFFER_SIZE = 1000;

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
    private readonly appVersion: string;
    private readonly build: string;
    private readonly device: string;
    private context: string[] = [];

    constructor(opts: FileTransportConfig) {
        this.appVersion = opts.appVersion;
        this.build = opts.build;
        this.device = `${opts.deviceInfo.name}, ${opts.deviceInfo.osVersion}`;
    }

    public log(entry: LogEntry): void {
        const serialized = this.serialize(entry);

        if (entry.level < LogLevel.WARN) {
            this.context.push(serialized);

            if (this.context.length > CONTEXT_BUFFER_SIZE) {
                this.context.shift();
            }

            return;
        }

        if (entry.level >= LogLevel.ERROR) {
            this.writeToFile([...this.context, serialized]);
            this.context = [];

            return;
        }

        this.writeToFile([serialized]);
    }

    public async share(): Promise<void> {
        const file = new File(Paths.cache, FILENAME);
        if (!file.exists) return;

        await shareAsync(file.uri, {
            mimeType: 'application/x-ndjson',
            dialogTitle: 'Share Safely Logs'
        });
    }

    public async read(): Promise<LogRecord[]> {
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

    private writeToFile(lines: string[]): void {
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
