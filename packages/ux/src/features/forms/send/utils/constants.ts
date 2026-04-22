import { BLOCKCHAIN_NAME, BTC_ASSET, CryptoAsset } from '@safely/core';

export const BLOCKCHAIN_DEFAULT_TOKENS: Record<BLOCKCHAIN_NAME, CryptoAsset> = {
    [BLOCKCHAIN_NAME.BTC]: BTC_ASSET
};

export const DEFAULT_FIAT_DECIMALS = 2;

export const MIN_RECIPIENT_ADDRESS_LENGTH = 5;
