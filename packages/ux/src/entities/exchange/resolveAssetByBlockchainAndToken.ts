import { BTC_ASSET, InvalidBlockchainAndTokenError } from '@safely/core';

export function resolveAssetByBlockchainAndToken(blockchain: string, token: string) {
    if (blockchain === 'bitcoin' && token === 'native') {
        return BTC_ASSET;
    }
    throw new InvalidBlockchainAndTokenError(blockchain, token);
}
