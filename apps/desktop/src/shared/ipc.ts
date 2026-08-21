import { z } from 'zod';

export const IPC_CHANNEL = {
    appRelaunch: 'safely:app:relaunch',
    appClearData: 'safely:app:clear-data',
    appState: 'safely:app:state',
    windowFullScreen: 'safely:window:full-screen',
    openExternal: 'safely:shell:open-external',

    /* One channel group per backing store, so which store a call reaches is decided by the channel
       and not by a string in the payload: a renderer cannot ask the wrong store, and a store with
       different rules is added as its own group. */
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
    },
    secureEncryptedStore: {
        get: 'safely:secure-encrypted-store:get',
        set: 'safely:secure-encrypted-store:set',
        remove: 'safely:secure-encrypted-store:remove',
        clear: 'safely:secure-encrypted-store:clear',
        keys: 'safely:secure-encrypted-store:keys',
        removePrefix: 'safely:secure-encrypted-store:remove-prefix'
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

export const sAppState = z.enum(['active', 'background', 'inactive', 'unknown']);
export type AppState = z.infer<typeof sAppState>;

export const sIsFullScreen = z.boolean();

/**
 * Why a secret operation failed, and the whole of what the renderer is told: the underlying
 * message could name a key or an OSStatus, and it crosses the process boundary verbatim.
 * `CORRUPT` is an item that exists and does not hold the UTF-8 we wrote — never treated as absence.
 */
export const sKeychainErrorCode = z.enum(['UNAVAILABLE', 'CORRUPT']);
export type KeychainErrorCode = z.infer<typeof sKeychainErrorCode>;
