import * as z from 'zod';

import { ASSET_ID_DOMAIN, ASSET_TYPE } from './I-asset';
import {
    ICryptoAsset,
    ICryptoAssetId,
    NATIVE_CRYPTO_ASSET_ID_DOMAIN,
    sCryptoAssetBase
} from './I-crypto-asset';
import { Id } from '../../utils/id';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export const sBtcAssetId = z
    .object({
        type: z.literal(ASSET_TYPE.CRYPTO),
        blockchain: z.literal(BLOCKCHAIN_NAME.BTC)
    })
    .transform(_ => new BtcAssetId());
export class BtcAssetId extends Id implements ICryptoAssetId {
    public readonly type = ASSET_TYPE.CRYPTO;

    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    public toString(): string {
        return this.of(ASSET_ID_DOMAIN, this.type, this.blockchain, NATIVE_CRYPTO_ASSET_ID_DOMAIN);
    }

    public toJSON(): z.input<typeof sBtcAssetId> {
        return {
            type: this.type,
            blockchain: this.blockchain
        };
    }
}

export const sBtcAsset = z.intersection(
    z.object({
        id: sBtcAssetId
    }),
    sCryptoAssetBase
);
export interface IBtcAsset extends ICryptoAsset {
    id: BtcAssetId;
}

export const BTC_ASSET: IBtcAsset = {
    id: new BtcAssetId(),
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    image: '/resources/images/btc-logo.svg'
};

export type BtcAsset = IBtcAsset;
