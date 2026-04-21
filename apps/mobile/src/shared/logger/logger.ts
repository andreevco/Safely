import { Build } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
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

    const transport = new SanitizedTransport(
        new CombinedTransport([new ConsoleTransport(), fileTransport])
    );

    const logger = new Logger(transport);
    logger.setLogsFilter(
        opts.isDev
            ? logsFilterMinSeverityLevel(LogLevel.TRACE)
            : logsFilterMinSeverityLevel(LogLevel.INFO)
    );

    return {
        logger,
        shareLogs: () => fileTransport.shareLogs()
    };
}
