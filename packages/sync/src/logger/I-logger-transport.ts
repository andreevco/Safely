import type { LogEntry } from './log-entry';

export type LoggerLifecycleContext = {
    accountIds: readonly string[];
};

export interface ILoggerTransport {
    log(entry: LogEntry): void;
    onAfterAppOpened?(ctx: LoggerLifecycleContext): void | Promise<void>;
    onBeforeAppClosed?(ctx: LoggerLifecycleContext): void | Promise<void>;
}
