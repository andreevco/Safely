import type { ILoggerTransport } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
    logsFilterMinSeverityLevel
} from '@safely/sync';

import type { FileTransport } from './file-transport';
import { SanitizedTransport } from './sanitized-transport';

const SAF751_TRACE_EVERYTHING = true;

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
        transport = new SanitizedTransport(fileTransport);
        filter = logsFilterMinSeverityLevel(LogLevel.INFO);
    }

    const logger = new Logger(transport);
    logger.setLogsFilter(
        SAF751_TRACE_EVERYTHING ? logsFilterMinSeverityLevel(LogLevel.TRACE) : filter
    );

    return logger;
}
