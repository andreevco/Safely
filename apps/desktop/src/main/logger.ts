import { app } from 'electron';

import { ConsoleTransport, Logger, LogLevel, logsFilterMinSeverityLevel } from '@safely/sync';

/** Separate from the renderer's: main must be able to report a failure before any window exists. */
export const mainLogger = new Logger(new ConsoleTransport()).child('main');

/* The default filter starts at INFO, which would hide the forwarded renderer output. */
mainLogger.setLogsFilter(
    logsFilterMinSeverityLevel(app.isPackaged ? LogLevel.INFO : LogLevel.TRACE)
);
