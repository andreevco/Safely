import type { CacheSchemaKey } from './cache-config';

export type SafelyQueryMeta = {
    accountId?: string;
    persist?: boolean;
    schemaKey?: CacheSchemaKey;
};

declare module '@tanstack/react-query' {
    interface Register {
        queryMeta: SafelyQueryMeta;
    }
}
