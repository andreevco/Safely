import { defineQueryKeys, finalKey } from '../../shared';

export const portfolioKeys = defineQueryKeys('portfolio', {
    all: () => finalKey,
    active: () => finalKey
});
