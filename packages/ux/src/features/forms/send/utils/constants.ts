import { BLOCKCHAIN_NAME, BTC_ASSET, CryptoAsset } from '@safely/core/entities';

export const BTC_ADDRESS_PATTERN = /^(1|3|bc1|tb1)[a-zA-Z0-9]{14,}$/i;

export const BLOCKCHAIN_DEFAULT_TOKENS: Record<BLOCKCHAIN_NAME, CryptoAsset> = {
    [BLOCKCHAIN_NAME.BTC]: BTC_ASSET
};

export const DEFAULT_FIAT_DECIMALS = 2;

export const RECIPIENT_DEBOUNCE_MS = 400;
