import { BtcAsset, BtcAssetAmount } from '../../entities';
import { TransactionFeeCrypto } from '../shared';

export type BtcTransferRequest = BtcTransferRequestNotMax | BtcTransferRequestMax;

export type BtcTransferRequestNotMax = {
    type: 'not-max';
    recipientAddress: string;
    amount: BtcAssetAmount;
    feeType: BtcFeeType;
};

export type BtcTransferRequestMax = {
    type: 'max';
    recipientAddress: string;
    feeType: BtcFeeType;
};

export type BtcEstimation = {
    fee: TransactionFeeCrypto<BtcAsset>;
    feeType: BtcFeeType;
    txTargetBlock: number;
};

export enum BtcFeeType {
    FAST = 'FAST',
    SLOW = 'SLOW'
}
