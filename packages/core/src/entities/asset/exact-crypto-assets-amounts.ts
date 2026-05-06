import type { BigSource } from 'big.js';
import type Big from 'big.js';

import { CryptoAssetAmount } from './asset-amount';
import type { BtcAsset } from './btc-asset';
import { BTC_ASSET } from './btc-asset';

export class BtcAssetAmount extends CryptoAssetAmount<BtcAsset> {
    public static fromWeiAmount(amount: bigint | string | Big) {
        return new BtcAssetAmount({ weiAmount: amount });
    }

    public static fromRelativeAmount(amount: BigSource) {
        return new BtcAssetAmount({ relativeAmount: amount });
    }

    private constructor(
        params: { relativeAmount: BigSource } | { weiAmount: bigint | string | Big }
    ) {
        super({ ...params, asset: BTC_ASSET });
    }
}
