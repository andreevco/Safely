import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils';

import type { Network } from './bitcoinjs';
import { bitcoin } from './bitcoinjs';
import { BtcAddress } from './btc-address';
import type { BtcApi, BtcApiUtxo } from '../../api/btc';

export type PsbtRequest = {
    inputs: BtcApiUtxo[];
    outputs: { address: string; value: bigint }[];
};

const SIG_SIZE = 73;
const PUBKEY_SIZE = 33;
const SCHNORR_SIG_SIZE = 64;
const ESTIMATION_WITNESS = [Buffer.alloc(SIG_SIZE, 0), Buffer.alloc(PUBKEY_SIZE, 0)];

export class BtcPsbtBuilder {
    constructor(
        private readonly btcApi: BtcApi,
        private readonly bitcoinNetwork: Network
    ) {}

    private readonly nonTaprootEstimationFinalizer = (
        _inputIndex: number,
        _input: unknown,
        script: Uint8Array,
        isSegwit: boolean,
        isP2SH: boolean,
        _isP2WSH: boolean
    ): { finalScriptSig: Uint8Array | undefined; finalScriptWitness: Uint8Array | undefined } => {
        if (isSegwit) {
            const finalScriptSig = isP2SH
                ? Buffer.from(bitcoin.script.compile([script]))
                : undefined;

            return {
                finalScriptWitness: witnessStackToScriptWitness(ESTIMATION_WITNESS),
                finalScriptSig
            };
        }

        return {
            finalScriptWitness: undefined,
            finalScriptSig: Buffer.from(
                bitcoin.script.compile([ESTIMATION_WITNESS[0], ESTIMATION_WITNESS[1]])
            )
        };
    };

    private readonly taprootEstimationFinalizer: NonNullable<
        Parameters<bitcoin.Psbt['finalizeTaprootInput']>[2]
    > = () => ({
        finalScriptWitness: witnessStackToScriptWitness([Buffer.alloc(SCHNORR_SIG_SIZE, 0)])
    });

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

    public async calculateTransactionVSize(req: PsbtRequest): Promise<bigint> {
        const psbt = await this.buildPsbt(req);

        req.inputs.forEach((utxo, i) => {
            if (!utxo.address) {
                throw new Error('invalid address');
            }

            if (BtcAddress.type(utxo.address) === 'P2TR') {
                psbt.finalizeTaprootInput(i, undefined, this.taprootEstimationFinalizer);
            } else {
                psbt.finalizeInput(i, this.nonTaprootEstimationFinalizer);
            }
        });

        return BigInt(psbt.extractTransaction().virtualSize());
    }
}
