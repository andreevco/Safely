import { createMobileLogger } from './logger';
import packageJson from '../../../package.json';
import { build, deviceInfo } from '../app-meta';

const { logger, shareLogs } = createMobileLogger({
    appVersion: packageJson.version,
    build,
    deviceInfo,
    isDev: __DEV__
});

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

export { logger, shareLogs };
