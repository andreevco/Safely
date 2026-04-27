import { Logger, LoggerLifecycleContext } from '@safely/sync';

export interface ILoggerRegistry {
    readonly systemLogger: Logger;
    getAccountLogger(accountId: string): Logger;

    onAfterAppOpened(ctx: LoggerLifecycleContext): Promise<void>;
    onBeforeAppClosed(ctx: LoggerLifecycleContext): Promise<void>;

    shareAllLogs(): Promise<void>;
}

export { useLogger } from './use-logger';
export { useLoggerLifecycle } from './use-logger-lifecycle';
