import { BtcEstimation, BtcTransactionTemplate } from './btc';
import { BtcSendResult } from './btc/btc-transaction-template';

export type Estimation = BtcEstimation;
export type TransactionTemplate = BtcTransactionTemplate;
export type SendResult = BtcSendResult;

export * from './shared';
export * from './btc';
