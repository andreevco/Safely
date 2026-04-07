import Big from 'big.js';

import { BtcPsbtBulder } from './btc-psbt-bulder';
import { BtcTransactionTemplate } from './btc-transaction-template';
import {
    BtcFeeType,
    BtcTransferRequest,
    BtcTransferRequestMax,
    BtcTransferRequestNotMax
} from './types';
import { getUtxoTotal } from './utils';
import { BtcApi, BtcApiEstimatedFee, BtcApiUtxo } from '../../api/btc';
import { BtcAssetAmount, btcNetworkConfig, BtcWallet } from '../../entities';
import { abs, assertUnreachable, IIdentifiable, toBig } from '../../utils';

export type SpentUtxo = { txid: string; vout: number; value: string };

export class BtcEstimator implements IIdentifiable {
    public readonly id: string;

    private readonly psbtBulder: BtcPsbtBulder;

    constructor(
        private readonly btcApi: BtcApi,
        private readonly wallet: BtcWallet
    ) {
        this.id = `${this.constructor.name}:${this.btcApi.id}:${this.wallet.id.toString()}`;
        this.psbtBulder = new BtcPsbtBulder(btcApi, btcNetworkConfig[this.wallet.network]);
    }

    private async getFeeValue(
        feeType: BtcFeeType
    ): Promise<{ targetBlock: number; feeSatVb: Big }> {
        const feePrice = await this.btcApi.getFeePrice();

        const format = (v: BtcApiEstimatedFee) => ({
            targetBlock: v.target_block,
            feeSatVb: toBig(v.fee)
        });

        switch (feeType) {
            case BtcFeeType.FAST:
                return format(feePrice.fast_send);
            case BtcFeeType.SLOW:
                return format(feePrice.normal_send);
            default:
                assertUnreachable(feeType);
        }
    }

    public async getSendFee(
        request: Omit<BtcTransferRequestMax, 'type' | 'estimatedAmount'>,
        utxo: BtcApiUtxo[]
    ): Promise<BtcAssetAmount> {
        const { fee } = await this.estimateSendFee(request, utxo);
        return fee;
    }

    public async estimate(
        request: BtcTransferRequest,
        utxo: BtcApiUtxo[]
    ): Promise<BtcTransactionTemplate> {
        switch (request.type) {
            case 'max':
                return this.estimateMax(request, utxo);
            case 'not-max':
                return this.estimateNotMax(request, utxo);
            default:
                assertUnreachable(request);
        }
    }

    private async estimateNotMax(
        request: BtcTransferRequestNotMax,
        utxos: BtcApiUtxo[]
    ): Promise<BtcTransactionTemplate> {
        if (request.amount.weiAmount <= 0n) {
            throw new Error('Amount must be greater than zero');
        }

        const { feeSatVb, targetBlock } = await this.getFeeValue(request.feeType);

        if (!utxos.length) {
            throw new Error('No UTXOs available');
        }

        const totalBalance = getUtxoTotal(utxos);

        const vSize = await this.psbtBulder.calculateTransactionVSize({
            inputs: utxos,
            outputs: [
                { address: request.recipientAddress, value: request.amount.weiAmount },
                { address: this.wallet.address, value: 1n } // value doesn't affect vSize
            ]
        });

        const feeSat = feeSatVb.mul(toBig(vSize)).round(0, Big.roundUp);
        const fee = BtcAssetAmount.fromWeiAmount(feeSat);

        if (totalBalance.lt(request.amount.add(fee))) {
            throw new Error('Not enough funds');
        }

        return new BtcTransactionTemplate(this.btcApi, this.wallet, request, utxos, {
            fee: { amount: fee, type: 'crypto' },
            feeType: request.feeType,
            txTargetBlock: targetBlock
        });
    }

    private async estimateSendFee(
        request: Omit<BtcTransferRequestMax, 'type' | 'estimatedAmount'>,
        utxos: BtcApiUtxo[]
    ) {
        const { feeSatVb, targetBlock } = await this.getFeeValue(request.feeType);

        if (!utxos.length) {
            throw new Error('No UTXOs available');
        }

        const totalBalance = getUtxoTotal(utxos);

        const vSize = await this.psbtBulder.calculateTransactionVSize({
            inputs: utxos,
            outputs: [{ address: request.recipientAddress, value: 1n }]
        });

        const feeSat = feeSatVb.mul(toBig(vSize)).round(0, Big.roundUp);
        const fee = BtcAssetAmount.fromWeiAmount(feeSat);

        if (totalBalance.lt(fee)) {
            throw new Error('Total balance is not enough to cover transaction fee');
        }

        return { fee, targetBlock, utxos };
    }

    private async estimateMax(
        request: BtcTransferRequestMax,
        utxos: BtcApiUtxo[]
    ): Promise<BtcTransactionTemplate> {
        const { fee, targetBlock } = await this.estimateSendFee(request, utxos);
        const totalBalance = getUtxoTotal(utxos);

        const amount = totalBalance.sub(fee);
        if (abs(request.estimatedAmount.weiAmount - amount.weiAmount) * 2n > fee.weiAmount) {
            throw new Error('Amount changed since it was estimated');
        }

        return new BtcTransactionTemplate(
            this.btcApi,
            this.wallet,
            { amount: totalBalance.sub(fee), ...request },
            utxos,
            {
                fee: { amount: fee, type: 'crypto' },
                feeType: request.feeType,
                txTargetBlock: targetBlock
            }
        );
    }
}
