import { Build, ILoggerTransport } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
    LogsFilter,
    logsFilterMinSeverityLevel
} from '@safely/sync';

import { accountLogHash } from './account-hash';
import { FileTransport } from './file-transport';
import { getAccountFilename, getAccountMmkvId, SYSTEM_FILENAME, SYSTEM_MMKV_ID } from './naming';
import { SanitizedTransport } from './sanitized-transport';

export type MobileLoggerConfig = {
    appVersion: string;
    build: Build;
    deviceInfo: { name: string; osVersion: string };
    isDev: boolean;
};

export type LoggerBundle = {
    logger: Logger;
    transport: FileTransport;
};

export function createSystemLogger(config: MobileLoggerConfig): LoggerBundle {
    const fileTransport = new FileTransport({
        filename: SYSTEM_FILENAME,
        mmkvId: SYSTEM_MMKV_ID,
        appVersion: config.appVersion,
        build: config.build,
        deviceInfo: config.deviceInfo
    });
    const logger = buildLogger(fileTransport, {
        isDev: config.isDev,
        label: 'system'
    });

    return {
        logger,
        transport: fileTransport
    };
}

export function createAccountLoggerInstance(
    accountId: string,
    config: MobileLoggerConfig
): LoggerBundle {
    const hash = accountLogHash(accountId);
    const fileTransport = new FileTransport({
        filename: getAccountFilename(hash),
        mmkvId: getAccountMmkvId(hash),
        appVersion: config.appVersion,
        build: config.build,
        deviceInfo: config.deviceInfo
    });
    const logger = buildLogger(fileTransport, {
        isDev: config.isDev,
        label: hash.slice(0, 4)
    });

    return {
        logger,
        transport: fileTransport
    };
}

function buildLogger(
    fileTransport: FileTransport,
    opts: { isDev: boolean; label: string }
): Logger {
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

    return logger.child(opts.label);
}
