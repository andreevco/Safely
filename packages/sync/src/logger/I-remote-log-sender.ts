import { LogEntry } from './log-entry';

export interface IRemoteLogSender {
    send(entry: LogEntry): Promise<boolean>;
}
