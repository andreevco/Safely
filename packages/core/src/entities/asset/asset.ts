import type { CryptoAsset, CryptoAssetId } from './crypto-asset';
import type { FiatAsset, FiatAssetId } from './fiat-asset';

export type AssetId = CryptoAssetId | FiatAssetId;
export type Asset = CryptoAsset | FiatAsset;
