import packageJson from '../../../package.json';
import { build, deviceInfo } from '../app-meta';
import { LoggerRegistry } from './registry';
import { createAccountTransport, createSystemTransport, TransportConfig } from './transports';

const transportConfig: TransportConfig = {
    appVersion: packageJson.version,
    build,
    deviceInfo
};

const loggerRegistry = new LoggerRegistry({
    isDev: __DEV__,
    systemTransport: createSystemTransport(transportConfig),
    createAccountTransport: accountId => createAccountTransport(transportConfig, accountId)
});

const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    loggerRegistry.systemLogger.error(`[Unhandled${isFatal ? ' FATAL' : ''}]`, error);
    prevHandler(error, isFatal);
});

if (typeof globalThis.onunhandledrejection === 'undefined') {
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
        loggerRegistry.systemLogger.error('[Unhandled Promise Rejection]', event.reason);
    };
}

export { loggerRegistry };
