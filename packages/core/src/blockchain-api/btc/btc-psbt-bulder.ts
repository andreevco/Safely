import { Network } from 'bitcoinjs-lib';
import * as bitcoin from 'bitcoinjs-lib';

import { BtcAddress } from './btc-address';
import { BtcApi, BtcApiUtxo } from '../../api/btc';

export type PsbtRequest = {
    inputs: BtcApiUtxo[];
    outputs: { address: string; value: bigint }[];
};

export class BtcPsbtBulder {
    constructor(
        private readonly btcApi: BtcApi,
        private readonly bitcoinNetwork: Network
    ) {}

    private async getParsedUtxos(utxos: BtcApiUtxo[]) {
        return Promise.all(
            utxos.map(async utxo => {
                if (!utxo.address) {
                    throw new Error('invalid address');
                }

                if (BtcAddress.isLegacy(utxo.address)) {
                    const txInfo = await this.btcApi.getTransaction(utxo.txid);
                    if (!txInfo.hex) {
                        throw new Error('invalid tx hex: undefined');
                    }

                    return {
                        ...utxo,
                        type: 'legacy' as const,
                        address: utxo.address,
                        tx: Buffer.from(txInfo.hex, 'hex')
                    };
                } else {
                    return {
                        ...utxo,
                        address: utxo.address,
                        type: 'segwit' as const
                    };
                }
            })
        );
    }

    public async buildPsbt({ inputs, outputs }: PsbtRequest) {
        const psbt = new bitcoin.Psbt({ network: this.bitcoinNetwork });

        const utxos = await this.getParsedUtxos(inputs);
        utxos.forEach(utxo => {
            const inputConfig: Parameters<typeof psbt.addInput>[0] = {
                hash: utxo.txid,
                index: utxo.vout
            };

            if (utxo.type === 'legacy') {
                inputConfig.nonWitnessUtxo = utxo.tx;
            } else {
                const script = bitcoin.address.toOutputScript(utxo.address, this.bitcoinNetwork);
                inputConfig.witnessUtxo = {
                    script,
                    value: BigInt(utxo.value)
                };
            }

            psbt.addInput(inputConfig);
        });

        outputs.forEach(o => psbt.addOutput({ address: o.address, value: o.value }));

        return psbt;
    }

    public async calculateTransactionVSize(req: PsbtRequest) {
        const psbt = await this.buildPsbt(req);
        psbt.finalizeAllInputs();

        return BigInt(psbt.extractTransaction().virtualSize());
    }
}
