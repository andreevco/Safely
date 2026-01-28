import { BtcAsset, CryptoAssetAmount } from '../../entities';
import { TransactionFeeCrypto } from '../shared';

export interface BtcTransferRequest {
    recipientAddress: string;
    amount: CryptoAssetAmount<BtcAsset>;
    feeType: BtcFeeType;
}

export type BtcEstimation = {
    fee: TransactionFeeCrypto<BtcAsset>;
    feeType: BtcFeeType;
    txTargetBlock: number;
};

export enum BtcFeeType {
    FAST = 'FAST',
    SLOW = 'SLOW'
}
