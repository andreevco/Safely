import { BtcAssetId, BtcAsset, sBtcAsset, sBtcAssetId } from './btc-asset';
import { ASSET_TYPE, IAsset } from './I-asset';

export const sCryptoAsset = sBtcAsset;
export type CryptoAsset = BtcAsset;

export const sCryptoAssetId = sBtcAssetId;
export type CryptoAssetId = BtcAssetId;

export function isCryptoAsset(asset: IAsset): asset is CryptoAsset {
    return 'type' in asset.id && asset.id.type === ASSET_TYPE.CRYPTO;
}
