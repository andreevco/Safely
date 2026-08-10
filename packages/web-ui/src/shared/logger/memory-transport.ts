import type { ILoggerTransport, LogEntry } from '@safely/sync';

const DEFAULT_CAPACITY = 500;

/** Bounded on purpose: an unbounded log in a long-running desktop session is a leak. */
export class MemoryTransport implements ILoggerTransport {
    private entries: LogEntry[] = [];

    constructor(private readonly capacity: number = DEFAULT_CAPACITY) {}

    public log(entry: LogEntry): void {
        this.entries.push(entry);

        if (this.entries.length > this.capacity) {
            this.entries.splice(0, this.entries.length - this.capacity);
        }
    }

    public read(): readonly LogEntry[] {
        return this.entries;
    }

    public erase(): void {
        this.entries = [];
    }
}
