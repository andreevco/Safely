import { File, Paths } from 'expo-file-system';
import { createMMKV } from 'react-native-mmkv';

import { ILoggerTransport, LogEntry, LogLevel } from '@safely/sync';

const DEFAULT_FLUSH_INTERVAL_MS = 30_000;
const DEFAULT_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

type FileTransportConfig = {
    mmkvId: string;
    filename: string;
    appVersion: string;
    build: string;
    deviceInfo: { name: string; osVersion: string };
    flushIntervalMs?: number;
    maxFileSizeBytes?: number;
};

export class FileTransport implements ILoggerTransport {
    private readonly mmkv;
    public readonly filename: string;
    private readonly build?: string;
    private readonly device?: string;
    private readonly appVersion?: string;
    private readonly flushIntervalMs: number;
    private readonly maxFileSizeBytes: number;
    private readonly flushHandle: ReturnType<typeof setInterval>;
    private flushing: Promise<void> = Promise.resolve();
    private flushScheduled = false;
    private seqNo = 0;
    private isDestroyed = false;

    constructor(opts: FileTransportConfig) {
        this.mmkv = createMMKV({ id: opts.mmkvId });
        this.filename = opts.filename;
        this.appVersion = opts.appVersion;
        this.build = opts.build;
        this.device = `${opts.deviceInfo.name}, ${opts.deviceInfo.osVersion}`;
        this.flushIntervalMs = opts.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
        this.maxFileSizeBytes = opts.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
        this.flushHandle = setInterval(() => void this.flush(), this.flushIntervalMs);
    }

    public log(entry: LogEntry): void {
        if (this.isDestroyed) return;

        const key = `e_${Date.now()}_${this.seqNo++}`;
        this.mmkv.set(
            key,
            JSON.stringify({
                t: entry.timestamp.toISOString(),
                l: entry.level,
                p: entry.path,
                m: entry.message.map(serializeMessage).join(' '),
                v: this.appVersion,
                b: this.build,
                d: this.device
            })
        );

        if (entry.level >= LogLevel.ERROR) {
            void this.flush();
        }
    }

    public flush(): Promise<void> {
        if (this.isDestroyed) return Promise.resolve();

        if (!this.flushScheduled) {
            this.flushScheduled = true;
            this.flushing = this.flushing.then(() => {
                this.flushScheduled = false;

                return this.doFlush();
            });
        }

        return this.flushing;
    }

    public async destroy(): Promise<void> {
        if (this.isDestroyed) return;

        this.isDestroyed = true;
        clearInterval(this.flushHandle);

        await this.flushing;
        this.clearState();
    }

    public async clear(): Promise<void> {
        if (this.isDestroyed) return;

        await this.flushing;
        this.clearState();
    }

    private clearState(): void {
        this.mmkv.clearAll();

        try {
            const logFile = new File(Paths.document, this.filename);
            if (logFile.exists) logFile.delete();
        } catch (e) {
            console.error('[FileTransport] clear: failed to delete file', e);
        }
    }

    private doFlush(): void {
        const keys = this.mmkv.getAllKeys().filter(k => k.startsWith('e_'));
        if (keys.length === 0) return;

        const lines: string[] = [];
        for (const key of keys) {
            const line = this.mmkv.getString(key);
            if (line) lines.push(line);
            this.mmkv.remove(key);
        }

        if (lines.length === 0) return;

        const content = lines.join('\n') + '\n';
        const logFile = new File(Paths.document, this.filename);

        try {
            if (logFile.exists && logFile.size > this.maxFileSizeBytes) {
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
