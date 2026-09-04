import type { ILoggerTransport } from '@safely/core';
import {
    CombinedTransport,
    ConsoleTransport,
    Logger,
    LogLevel,
    logsFilterMinSeverityLevel
} from '@safely/sync';
import { SanitizedTransport } from '@safely/ux';

import { MemoryTransport } from './memory-transport';

/** Mirrors the mobile setup minus the file transport: nothing writes log data to disk yet. */
export function buildWebLogger(isDev: boolean): { logger: Logger; memory: MemoryTransport } {
    const memory = new MemoryTransport();

    /* the ring can be exported by the user, so it never holds raw sensitive values */
    const transports: ILoggerTransport[] = [new SanitizedTransport(memory)];

    if (isDev) {
        transports.unshift(new ConsoleTransport());
    }

    const logger = new Logger(new CombinedTransport(transports));
    logger.setLogsFilter(logsFilterMinSeverityLevel(isDev ? LogLevel.TRACE : LogLevel.INFO));

    return { logger, memory };
}
