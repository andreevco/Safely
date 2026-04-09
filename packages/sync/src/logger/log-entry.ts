import { LogLevel } from './log-level';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    path: string[];
    message: string;
    appVersion?: string;
}
