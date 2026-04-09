import { ILoggerTransport } from './I-logger-transport';
import { LogEntry } from './log-entry';
import { LogLevel } from './log-level';

export class ConsoleTransport implements ILoggerTransport {
    public log(entry: LogEntry): void {
        const levelStr = LogLevel[entry.level].padStart(5);
        const pathStr = entry.path.length > 0 ? ` [${entry.path.join('>')}]` : '';
        const versionStr = entry.appVersion ? ` [v${entry.appVersion}]` : '';
        const prefix = `[${levelStr}] [${entry.timestamp}]${versionStr}${pathStr}`;

        if (entry.level === LogLevel.ERROR) {
            console.error(prefix, entry.message);
        } else if (entry.level === LogLevel.WARN) {
            console.warn(prefix, entry.message);
        } else {
            console.log(prefix, entry.message);
        }
    }
}
