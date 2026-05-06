import type { CryptoAsset } from '@safely/core';
import { BLOCKCHAIN_NAME, BTC_ASSET } from '@safely/core';

export const BLOCKCHAIN_DEFAULT_TOKENS: Record<BLOCKCHAIN_NAME, CryptoAsset> = {
    [BLOCKCHAIN_NAME.BTC]: BTC_ASSET
};

export const DEFAULT_FIAT_DECIMALS = 2;
