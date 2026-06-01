import { defineQueryKeys, finalKey } from '../../shared';

export const betaFeedWatchedKeys = defineQueryKeys('betaFeedWatched', {
    timestamp: finalKey
});
