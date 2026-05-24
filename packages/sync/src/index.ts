export type { IStorage, IEnumerableStorage, ITreeStorage } from './I-storage';

export type { ISyncAccount } from './account/I-sync-account';
export type { ISyncAccountFactory } from './account/I-sync-account-factory';
export { SyncAccountFactory, type SyncAccountFactoryOptions } from './account/sync-account-factory';

export type { OnboardingConnector } from './onboarding/connector';

export type { ISyncProvider } from './sync-provider/I-sync-provider';
export { SyncStatus } from './sync-provider/sync-status';
export type { ISyncStatusManager } from './sync-provider/sync-status';
export type { Device } from './device-manager/device-repository';
export { ReconnectFromAnotherAccountError } from './device-manager/device-management-service';

export { SyncError, OnboardingAbortedError } from './sync-error';

export { default as XHREventSource } from './eventsource/XHREventSource';

export type { ISecretEncryptor, SSecretDecrypted, SSecretEncrypted } from './secret-encryptor';
export { sSecretEncrypted, sSecretDecrypted } from './secret-encryptor';

export { type IsomorphicEventSource } from './utils/sse-stream';

export {
    LogLevel,
    Logger,
    ConsoleTransport,
    CombinedTransport,
    logsFilterMinSeverityLevel
} from './logger';
export type { LogEntry, ILoggerTransport, LoggerLifecycleContext, LogsFilter } from './logger';
