import { defineQueryKeys, finalKey } from '../../shared/query-core/query-key-factory';

export const portfolioKeys = defineQueryKeys('portfolio', {
    all: () => finalKey,
    active: () => finalKey
});
