import { Logger, LoggerLifecycleContext } from '@safely/sync';

export interface ILoggerRegistry {
    readonly systemLogger: Logger;
    readonly activeLogger: Logger;
    getAccountLogger(accountId: string): Logger;
    setActiveAccountId(accountId: string | null): void;

    onAccountsChanged(ctx: LoggerLifecycleContext): Promise<void>;
    onBeforeAppClosed(): Promise<void>;

    shareLogs(opts?: { accountId?: string }): Promise<void>;
}
