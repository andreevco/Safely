import type { LogLevel } from './log-level';

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    path: string[];
    message: unknown[];
}
