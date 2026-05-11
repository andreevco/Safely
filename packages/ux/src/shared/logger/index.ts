import type { Logger, LoggerLifecycleContext } from '@safely/sync';

export interface ILoggerRegistry {
    readonly systemLogger: Logger;
    getAccountLogger(accountId: string): Logger;

    onAccountsChanged(ctx: LoggerLifecycleContext): Promise<void>;
    onBeforeAppClosed(): Promise<void>;

    shareLogs(opts?: { accountId?: string }): Promise<void>;
}
