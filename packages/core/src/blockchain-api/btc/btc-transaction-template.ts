import { type PsbtRequest, BtcPsbtBuilder } from './btc-psbt-builder';
import { BtcSendDustError } from './errors';
import type { BtcEstimation } from './types';
import { getUtxoTotal, utxoPathToStruct } from './utils';
import type { BtcApi, BtcApiUtxo } from '../../api/btc';
import type { BtcAssetAmount, SignableBtcWallet, ExplorerFactory } from '../../entities';
import { BLOCKCHAIN_NAME, btcNetworkConfig } from '../../entities/blockchain';
import { getExternalErrorText } from '../../entities/errors/errors.service';
import { ellipsisMiddle } from '../../utils';

export class BtcTransactionTemplate {
    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    public sendResult: BtcSendResult | undefined;

    private readonly psbtBuilder: BtcPsbtBuilder;

    public get outputs(): PsbtRequest['outputs'] {
        const total = getUtxoTotal(this.utxos);
        const recipientOutput = {
            address: this.request.recipientAddress,
            value: this.request.amount.weiAmount
        };

        if (this.request.hasChange) {
            return [
                recipientOutput,
                {
                    address: this.wallet.address,
                    value: total.sub(this.request.amount).sub(this.estimation.fee.amount).weiAmount
                }
            ];
        } else {
            return [recipientOutput];
        }
    }

    public get inputs() {
        return this.utxos;
    }

    constructor(
        private readonly btcApi: BtcApi,
        public readonly wallet: SignableBtcWallet,
        public readonly request: {
            amount: BtcAssetAmount;
            recipientAddress: string;
            hasChange: boolean;
        },
        private readonly utxos: BtcApiUtxo[],
        public readonly estimation: BtcEstimation
    ) {
        this.psbtBuilder = new BtcPsbtBuilder(btcNetworkConfig[this.wallet.network]);
    }

    public async send(): Promise<BtcSendResult> {
        if (this.sendResult) {
            throw new Error(`Tx is already published, ${this.sendResult.txId}`);
        }

        const psbt = this.psbtBuilder.buildPsbt({
            inputs: this.utxos,
            outputs: this.outputs
        });

        const signed = await this.wallet.sign({
            psbt,
            utxos: this.utxos.map(u => ({
                derivationPath: utxoPathToStruct(u)
            }))
        });

        let result;
        try {
            result = await this.btcApi.sendTransaction(signed.toString('hex'));
        } catch (error) {
            if (getExternalErrorText(error).includes('dust')) {
                throw new BtcSendDustError();
            }
            throw error;
        }

        this.sendResult = {
            blockchain: BLOCKCHAIN_NAME.BTC,
            txId: result.txid,
            toString() {
                return ellipsisMiddle(result.txid, 6);
            },
            toExplorerUrl(explorerFactory: ExplorerFactory): string {
                return explorerFactory.createExplorer(BLOCKCHAIN_NAME.BTC).transaction(result.txid);
            }
        };

        return this.sendResult;
    }
}

export interface BtcSendResult {
    blockchain: BLOCKCHAIN_NAME.BTC;
    txId: string;
    toString(): string;
    toExplorerUrl(explorerFactory: ExplorerFactory): string;
}
