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
export const shareLogs = (): Promise<void> => transport.share();
export const readLogs = (): Promise<LogRecord[]> => transport.read();

const unhandledLogger = logger.child('unhandled');

const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    unhandledLogger.error(isFatal ? 'fatal' : 'error', error);
    prevHandler(error, isFatal);
});

if (typeof globalThis.onunhandledrejection === 'undefined') {
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
        unhandledLogger.error('promise rejection', event.reason);
    };
}
