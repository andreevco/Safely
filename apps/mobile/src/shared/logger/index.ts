import packageJson from '../../../package.json';
import { build, deviceInfo } from '../app-meta';
import { buildLogger } from './build-logger';
import { FileTransport, type LogRecord } from './file-transport';

export type { LogRecord } from './file-transport';

const transport = new FileTransport({
    appVersion: packageJson.version,
    build,
    deviceInfo
});

export const logger = buildLogger(transport, __DEV__);
export const flushLogs = (): Promise<void> => transport.flush();
export const shareLogs = (): Promise<void> => transport.share();
export const readLogs = (): Promise<LogRecord[]> => transport.read();

const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.error(`[Unhandled${isFatal ? ' FATAL' : ''}]`, error);
    prevHandler(error, isFatal);
});

if (typeof globalThis.onunhandledrejection === 'undefined') {
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
        logger.error('[Unhandled Promise Rejection]', event.reason);
    };
}
