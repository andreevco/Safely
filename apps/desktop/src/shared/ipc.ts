import { z } from 'zod';

/**
 * The IPC surface, shared by main (which validates and serves it) and preload (which forwards).
 * Channel names are constants, never composed at runtime.
 */
export const IPC_CHANNEL = {
    appInfo: 'safely:app:info',
    appRelaunch: 'safely:app:relaunch',
    appClearData: 'safely:app:clear-data',
    appState: 'safely:app:state',
    openExternal: 'safely:shell:open-external',
    securityAvailable: 'safely:security:available',
    securityCheck: 'safely:security:check',
    storeGet: 'safely:store:get',
    storeSet: 'safely:store:set',
    storeRemove: 'safely:store:remove',
    storeClear: 'safely:store:clear',
    storeKeys: 'safely:store:keys',
    storeRemovePrefix: 'safely:store:remove-prefix'
} as const;

/** Which of the three backing stores an operation addresses. */
export const sStoreScope = z.enum(['regular', 'encrypted', 'secureEncrypted']);
export type StoreScope = z.infer<typeof sStoreScope>;

/* Bounds keep a malformed renderer from driving main into unbounded work or unbounded files. */
const sKey = z.string().min(1).max(512);
const sPrefix = z.string().max(512);
const sValue = z.string().max(8 * 1024 * 1024);

export const sStoreKeyRequest = z.object({ scope: sStoreScope, key: sKey });
export const sStoreSetRequest = z.object({ scope: sStoreScope, key: sKey, value: sValue });
export const sStoreScopeRequest = z.object({ scope: sStoreScope });
export const sStorePrefixRequest = z.object({ scope: sStoreScope, prefix: sPrefix });

export const sOpenExternalRequest = z.object({ url: z.string().max(2048) });

export const sSecurityCheckRequest = z.object({
    title: z.string().max(200).optional(),
    subtitle: z.string().max(400).optional()
});

export const sAppInfo = z.object({
    version: z.string(),
    environment: z.enum(['production', 'development']),
    deviceName: z.string(),
    osVersion: z.string(),
    locale: z.string(),
    deviceCountryCode: z.string().nullable()
});
export type AppInfo = z.infer<typeof sAppInfo>;

export const sAppState = z.enum(['active', 'background', 'inactive', 'unknown']);
export type AppState = z.infer<typeof sAppState>;
