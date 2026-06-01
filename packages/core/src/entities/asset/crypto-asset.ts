import type { BtcAssetId, BtcAsset } from './btc-asset';
import { sBtcAsset, sBtcAssetId } from './btc-asset';
import type { IAsset } from './I-asset';
import { ASSET_TYPE } from './I-asset';

export const sCryptoAsset = sBtcAsset;
export type CryptoAsset = BtcAsset;

export const sCryptoAssetId = sBtcAssetId;
export type CryptoAssetId = BtcAssetId;

export function isCryptoAsset(asset: IAsset): asset is CryptoAsset {
    return 'type' in asset.id && asset.id.type === ASSET_TYPE.CRYPTO;
}
