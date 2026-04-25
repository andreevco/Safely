import packageJson from '../../../package.json';
import { build, deviceInfo } from '../app-meta';
import { createSystemLogger } from './logger';
import { LoggerRegistry } from './registry';

const config = {
    appVersion: packageJson.version,
    build,
    deviceInfo,
    isDev: __DEV__
};

const { logger: systemLogger, transport: systemTransport } = createSystemLogger(config);
const loggerRegistry = new LoggerRegistry({ config, systemLogger, systemTransport });

const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    systemLogger.error(`[Unhandled${isFatal ? ' FATAL' : ''}]`, error);
    prevHandler(error, isFatal);
});

if (typeof globalThis.onunhandledrejection === 'undefined') {
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
        systemLogger.error('[Unhandled Promise Rejection]', event.reason);
    };
}

export { loggerRegistry };
