import type { Logger } from '@safely/sync';

import { type PsbtRequest, BtcPsbtBuilder } from './btc-psbt-builder';
import { BtcSendDustError } from './errors';
import type { BtcEstimation } from './types';
import { getUtxoTotal, utxoPathToStruct } from './utils';
import type { BtcApi, BtcApiUtxo } from '../../api/btc';
import type { BtcAssetAmount, SignableBtcWallet, ExplorerFactory } from '../../entities';
import {
    BLOCKCHAIN_NAME,
    btcNetworkConfig,
    portfolioNetworkTypeByBtcNetwork
} from '../../entities/blockchain';
import { getExternalErrorText } from '../../entities/errors/errors.service';
import { ellipsisMiddle } from '../../utils';

export class BtcTransactionTemplate {
    public readonly blockchain = BLOCKCHAIN_NAME.BTC;

    public sendResult: BtcSendResult | undefined;

    private isSending = false;

    private readonly psbtBuilder: BtcPsbtBuilder;

    private readonly logger?: Logger;

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
        public readonly estimation: BtcEstimation,
        logger?: Logger
    ) {
        this.logger = logger?.child('BtcTransactionTemplate');
        this.psbtBuilder = new BtcPsbtBuilder(btcNetworkConfig[this.wallet.network]);
    }

    public async send(): Promise<BtcSendResult> {
        if (this.sendResult) {
            throw new Error(`Tx is already published, ${this.sendResult.txId}`);
        }

        if (this.isSending) {
            throw new Error('Tx in progress');
        }

        this.isSending = true;
        this.logger?.info('broadcasting transaction', { blockchain: this.blockchain });

        try {
            this.sendResult = await this._send();
            this.logger?.info('transaction broadcast succeeded', { txId: this.sendResult.txId });
            return this.sendResult;
        } catch (error) {
            this.logger?.error('transaction broadcast failed', error);
            throw error;
        } finally {
            this.isSending = false;
        }
    }

    private async _send(): Promise<BtcSendResult> {
        let prevTxs: Map<string, Uint8Array> | undefined;
        if (this.wallet.isPrevTxsRequired) {
            const rawTxs = await this.btcApi.getRawTransactions(this.utxos.map(u => u.txid));
            prevTxs = new Map(rawTxs.map(tx => [tx.txid, Buffer.from(tx.hex, 'hex')]));
        }

        const psbt = this.psbtBuilder.buildPsbt(
            {
                inputs: this.utxos,
                outputs: this.outputs
            },
            prevTxs
        );

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

        const networkType = portfolioNetworkTypeByBtcNetwork(this.wallet.network);

        return {
            blockchain: BLOCKCHAIN_NAME.BTC,
            txId: result.txid,
            toString() {
                return ellipsisMiddle(result.txid, 6);
            },
            toExplorerUrl(explorerFactory: ExplorerFactory): string {
                return explorerFactory
                    .createExplorer(BLOCKCHAIN_NAME.BTC, networkType)
                    .transaction(result.txid);
            }
        };
    }
}

export interface BtcSendResult {
    blockchain: BLOCKCHAIN_NAME.BTC;
    txId: string;
    toString(): string;
    toExplorerUrl(explorerFactory: ExplorerFactory): string;
}
