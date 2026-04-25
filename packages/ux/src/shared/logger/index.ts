import { Logger } from '@safely/sync';

export interface ILoggerRegistry {
    readonly systemLogger: Logger;
    getAccountLogger(accountId: string): Logger;
    destroyAccountLogger(accountId: string): Promise<void>;
    destroyAllLogs(): Promise<void>;
    keepOnlyAccountLogs(activeAccountIds: string[]): Promise<void>;
    shareAllLogs(): Promise<void>;
}
