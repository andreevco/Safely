import Big from 'big.js';

import { BtcPsbtBulder } from './btc-psbt-bulder';
import { BtcTransactionTemplate } from './btc-transaction-template';
import { BtcFeeType, BtcTransferRequest } from './types';
import { getUtxoTotal } from './utils';
import { BtcApi, BtcApiGasPrice } from '../../api/btc';
import { BtcAssetAmount, btcNetworkConfig, BtcWallet } from '../../entities';
import { assertUnreachable, IIdentifiable, toBig } from '../../utils';

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

        const format = (v: BtcApiGasPrice) => ({
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

    public async estimate(request: BtcTransferRequest): Promise<BtcTransactionTemplate> {
        if (request.amount.weiAmount <= 0n) {
            throw new Error('Amount must be greater than zero');
        }

        const { feeSatVb, targetBlock } = await this.getFeeValue(request.feeType);

        const utxos = await this.btcApi.getAccountUtxo(this.wallet);
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
}
