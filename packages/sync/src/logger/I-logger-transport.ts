import type { LogEntry } from './log-entry';

export interface ILoggerTransport {
    log(entry: LogEntry): void;
}
