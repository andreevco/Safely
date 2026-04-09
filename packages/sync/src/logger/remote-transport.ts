import { ILoggerTransport } from './I-logger-transport';
import { IRemoteLogSender } from './I-remote-log-sender';
import { LogEntry } from './log-entry';
import { LogLevel } from './log-level';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL_MS = 60_000;
const MAX_BUFFER_SIZE = 1000;

export class RemoteTransport implements ILoggerTransport {
    private readonly sender: IRemoteLogSender;
    private readonly batchSize: number;

    private readonly buffer: LogEntry[] = [];
    private timer: ReturnType<typeof setInterval> | null = null;
    private flushing: Promise<void> = Promise.resolve();
    private flushScheduled = false;

    constructor(opts: { sender: IRemoteLogSender; batchSize?: number; flushIntervalMs?: number }) {
        this.sender = opts.sender;
        this.batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;

        const flushInterval = opts.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
        this.timer = setInterval(() => void this.flush(), flushInterval);
    }

    public log(entry: LogEntry): void {
        if (this.buffer.length >= MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }
        this.buffer.push(entry);

        if (entry.level === LogLevel.ERROR || this.buffer.length >= this.batchSize) {
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

    public async dispose(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        await this.flush();
    }

    private async doFlush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const entries = this.buffer.splice(0);
        const failed: LogEntry[] = [];

        await Promise.allSettled(
            entries.map(async entry => {
                const sent = await this.sender.send(entry).catch(() => false);
                if (!sent) {
                    failed.push(entry);
                }
            })
        );

        if (failed.length > 0) {
            this.buffer.unshift(...failed.slice(0, MAX_BUFFER_SIZE - this.buffer.length));
        }
    }
}
