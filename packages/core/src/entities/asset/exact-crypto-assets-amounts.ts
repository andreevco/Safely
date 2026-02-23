import Big, { BigSource } from 'big.js';

import { CryptoAssetAmount } from './asset-amount';
import { BTC_ASSET, BtcAsset } from './btc-asset';

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
