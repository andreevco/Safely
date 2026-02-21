import { BtcPsbtBulder } from './btc-psbt-bulder';
import { BtcSendDustError } from './errors';
import { BtcEstimation, BtcTransferRequest } from './types';
import { getUtxoTotal, utxoPathToStruct } from './utils';
import { BtcApi, BtcApiUtxo } from '../../api/btc';
import { BLOCKCHAIN_NAME, btcNetworkConfig, BtcWallet, ExplorerFactory } from '../../entities';
import { getExternalErrorText } from '../../entities/errors/errors.service';
import { ellipsisMiddle } from '../../utils';

export class BtcTransactionTemplate {
    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    public sendResult: BtcSendResult | undefined;

    private readonly psbtBuilder: BtcPsbtBulder;

    constructor(
        private readonly btcApi: BtcApi,
        private readonly wallet: BtcWallet,
        public readonly request: BtcTransferRequest,
        private readonly utxos: BtcApiUtxo[],
        public readonly estimation: BtcEstimation
    ) {
        this.psbtBuilder = new BtcPsbtBulder(btcApi, btcNetworkConfig[this.wallet.network]);
    }

    public async send(): Promise<BtcSendResult> {
        if (this.sendResult) {
            throw new Error(`Tx is already published, ${this.sendResult.txId}`);
        }
        const total = getUtxoTotal(this.utxos);

        const psbt = await this.psbtBuilder.buildPsbt({
            inputs: this.utxos,
            outputs: [
                { address: this.request.recipientAddress, value: this.request.amount.weiAmount },
                {
                    address: this.wallet.address,
                    value: total.sub(this.request.amount).sub(this.estimation.fee.amount).weiAmount
                }
            ]
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
            if (getExternalErrorText(error).trim().startsWith('-26')) {
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
