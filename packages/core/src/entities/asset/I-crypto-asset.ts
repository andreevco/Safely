import { z } from 'zod';

import type { ASSET_TYPE, IAsset, IAssetId } from './I-asset';
import type { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export interface ICryptoAssetId extends IAssetId {
    type: ASSET_TYPE.CRYPTO;
    blockchain: BLOCKCHAIN_NAME;
}

export const sCryptoAssetBase = z.object({
    symbol: z.string(),
    decimals: z.number(),
    name: z.string().optional(),
    image: z.string().optional()
});

export interface ICryptoAsset extends IAsset {
    id: ICryptoAssetId;
    symbol: string;
    decimals: number;
    name?: string;
    image?: string;
}

export const NATIVE_CRYPTO_ASSET_ID_DOMAIN = 'native';
