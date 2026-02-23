import { CryptoAsset, CryptoAssetId } from './crypto-asset';
import { FiatAsset, FiatAssetId } from './fiat-asset';

export type AssetId = CryptoAssetId | FiatAssetId;
export type Asset = CryptoAsset | FiatAsset;
