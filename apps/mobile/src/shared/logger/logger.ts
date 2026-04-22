import { Build, ILoggerTransport } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
    LogsFilter,
    logsFilterMinSeverityLevel
} from '@safely/sync';

import { FileTransport } from './file-transport';
import { SanitizedTransport } from './sanitized-transport';

type MobileLoggerConfig = {
    appVersion: string;
    build: Build;
    deviceInfo: { name: string; osVersion: string };
    isDev: boolean;
};

type MobileLogger = {
    logger: Logger;
    shareLogs: () => Promise<void>;
};

export function createMobileLogger(opts: MobileLoggerConfig): MobileLogger {
    const fileTransport = new FileTransport({
        build: opts.build,
        appVersion: opts.appVersion,
        deviceInfo: opts.deviceInfo
    });

    let transport: ILoggerTransport;
    let filter: LogsFilter;
    if (opts.isDev) {
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

    return {
        logger,
        shareLogs: () => fileTransport.shareLogs()
    };
}
