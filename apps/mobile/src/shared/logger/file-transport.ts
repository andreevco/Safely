import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { createMMKV } from 'react-native-mmkv';

import { ILoggerTransport, LogEntry, LogLevel } from '@safely/sync';

const MMKV_ID = 'logger-buffer';
const FILENAME = 'safely.ndjson';
const FLUSH_INTERVAL_MS = 30_000;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

type FileTransportConfig = {
    appVersion: string;
    build: string;
    deviceInfo: { name: string; osVersion: string };
};

export class FileTransport implements ILoggerTransport {
    private readonly mmkv = createMMKV({ id: MMKV_ID });
    private readonly appVersion: string;
    private readonly build: string;
    private readonly device: string;
    private flushing: Promise<void> = Promise.resolve();
    private flushScheduled = false;
    private seqNo = 0;

    constructor(opts: FileTransportConfig) {
        this.appVersion = opts.appVersion;
        this.build = opts.build;
        this.device = `${opts.deviceInfo.name}, ${opts.deviceInfo.osVersion}`;
        setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    }

    public log(entry: LogEntry): void {
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
        if (!this.flushScheduled) {
            this.flushScheduled = true;
            this.flushing = this.flushing.then(() => {
                this.flushScheduled = false;

                return this.doFlush();
            });
        }

        return this.flushing;
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
