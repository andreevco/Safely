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

    /* One channel group per backing store, so which store a call reaches is decided by the channel
       and not by a string in the payload: a renderer cannot ask the wrong store, and a store with
       different rules (the vault in `doc/vault.md`) is added as its own group. */
    store: {
        get: 'safely:store:get',
        set: 'safely:store:set',
        remove: 'safely:store:remove',
        clear: 'safely:store:clear',
        keys: 'safely:store:keys',
        removePrefix: 'safely:store:remove-prefix'
    },
    encryptedStore: {
        get: 'safely:encrypted-store:get',
        set: 'safely:encrypted-store:set',
        remove: 'safely:encrypted-store:remove',
        clear: 'safely:encrypted-store:clear',
        keys: 'safely:encrypted-store:keys',
        removePrefix: 'safely:encrypted-store:remove-prefix'
    }
} as const;

/** The channel names of one store group, widened to `string` so either group fits. */
export type StoreChannels = { readonly [K in keyof (typeof IPC_CHANNEL)['store']]: string };

/* Bounds keep a malformed renderer from driving main into unbounded work or unbounded files. */
const sKey = z.string().min(1).max(512);
const sPrefix = z.string().max(512);
const sValue = z.string().max(8 * 1024 * 1024);

export const sStoreKeyRequest = z.object({ key: sKey });
export const sStoreSetRequest = z.object({ key: sKey, value: sValue });
export const sStorePrefixRequest = z.object({ prefix: sPrefix });

export const sOpenExternalRequest = z.object({ url: z.string().max(2048) });

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
