import { LogEntry } from './log-entry';

export interface ILoggerTransport {
    log(entry: LogEntry): void;
}
