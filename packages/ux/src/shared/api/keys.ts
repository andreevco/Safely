import { defineQueryKeys, finalKey } from '../query-core/query-key-factory';

export const apiKeys = defineQueryKeys('api', {
    bootConfig: (_apiId: string) => finalKey
});
