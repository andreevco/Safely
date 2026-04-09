import { Build, filterSensitiveData } from '@safely/core';
import {
    ConsoleTransport,
    ILoggerTransport,
    IRemoteLogSender,
    LogEntry,
    Logger,
    LogLevel,
    RemoteTransport
} from '@safely/sync';

import { FileTransport } from './file-transport';

class FilteredTransport implements ILoggerTransport {
    constructor(
        private readonly inner: ILoggerTransport,
        private readonly minLevel: LogLevel = LogLevel.TRACE
    ) {}

    public log(entry: LogEntry): void {
        if (entry.level < this.minLevel) return;

        this.inner.log({
            ...entry,
            message: filterSensitiveData(entry.message)
        });
    }

    public async flush(): Promise<void> {
        await this.inner.flush?.();
    }

    public async dispose(): Promise<void> {
        const result = this.inner.dispose?.();
        if (result instanceof Promise) await result;
    }
}

export function createMobileLogger(opts: {
    appVersion: string;
    build: Build;
    deviceInfo: { name: string; osVersion: string };
    isDev: boolean;
    remoteSender?: IRemoteLogSender;
}): { logger: Logger; shareLogs: () => Promise<void> } {
    const fileTransport = new FileTransport();
    const consoleTransport = new ConsoleTransport();

    const consoleLevel = opts.isDev ? LogLevel.TRACE : LogLevel.ERROR;

    const transports: ILoggerTransport[] = [
        new FilteredTransport(consoleTransport, consoleLevel),
        new FilteredTransport(fileTransport)
    ];

    if (!opts.isDev && opts.remoteSender) {
        const remoteTransport = new RemoteTransport({ sender: opts.remoteSender });
        transports.push(new FilteredTransport(remoteTransport, LogLevel.ERROR));
    }

    const logger = new Logger({ transports, appVersion: opts.appVersion });
    logger.setLevel(LogLevel.TRACE);

    return {
        logger,
        shareLogs: () => fileTransport.shareLogs()
    };
}
