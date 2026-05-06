import { ILoggerTransport } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
    logsFilterMinSeverityLevel
} from '@safely/sync';

import { FileTransport } from './file-transport';
import { SanitizedTransport } from './sanitized-transport';

export function buildLogger(fileTransport: FileTransport, isDev: boolean): Logger {
    let filter;
    let transport: ILoggerTransport;

    if (isDev) {
        transport = new CombinedTransport([
            new ConsoleTransport(),
            new SanitizedTransport(fileTransport)
        ]);
        filter = logsFilterMinSeverityLevel(LogLevel.TRACE);
    } else {
        transport = new SanitizedTransport(
            new CombinedTransport([new ConsoleTransport(), fileTransport])
        );
        filter = logsFilterMinSeverityLevel(LogLevel.WARN);
    }

    const logger = new Logger(transport);
    logger.setLogsFilter(filter);

    return logger;
}
