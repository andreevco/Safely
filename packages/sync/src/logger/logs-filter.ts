import { LogEntry } from './log-entry';
import { LogLevel } from './log-level';

export type LogsFilter = (entry: LogEntry) => boolean;

export function logsFilterMinSeverityLevel(level: LogLevel): LogsFilter {
    return (entry: LogEntry) => entry.level >= level;
}
