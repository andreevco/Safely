import { LogEntry } from './log-entry';

export interface ILoggerTransport {
    log(entry: LogEntry): void;

    flush?(): Promise<void>;

    dispose?(): void | Promise<void>;
}
