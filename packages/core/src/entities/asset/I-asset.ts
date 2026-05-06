import type { Id } from '../../utils/id';

export enum ASSET_TYPE {
    CRYPTO = 'CRYPTO',
    FIAT = 'FIAT'
}

export type IAssetId = Id;

export const ASSET_ID_DOMAIN = 'asset';

export interface IAsset {
    id: IAssetId;
}
