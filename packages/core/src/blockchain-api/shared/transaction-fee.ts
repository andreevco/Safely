import { CryptoAsset, CryptoAssetAmount } from '../../entities';

export type TransactionFee = TransactionFeeCrypto<CryptoAsset>;

export type TransactionFeeCrypto<T extends CryptoAsset> = {
    type: 'crypto';
    amount: CryptoAssetAmount<T>;
};
