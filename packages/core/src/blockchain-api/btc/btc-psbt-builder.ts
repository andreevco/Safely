import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils';

import type { Network } from './bitcoinjs';
import { bitcoin } from './bitcoinjs';
import { BtcAddress } from './btc-address';
import type { BtcApiUtxo } from '../../api/btc';

export type PsbtRequest = {
    inputs: BtcApiUtxo[];
    outputs: { address: string; value: bigint }[];
};

// Worst-case ECDSA signature in DER encoding plus 1-byte sighash flag (BIP66).
const MAX_DER_SIGNATURE_SIZE = 73;
// Compressed secp256k1 public key: 1-byte parity prefix + 32-byte X coordinate.
const COMPRESSED_PUBKEY_SIZE = 33;
// P2WPKH witness stack: <signature> <pubkey>. Used only for vSize estimation,
const P2WPKH_ESTIMATION_WITNESS = [
    Buffer.alloc(MAX_DER_SIGNATURE_SIZE, 0),
    Buffer.alloc(COMPRESSED_PUBKEY_SIZE, 0)
];

export class BtcPsbtBuilder {
    constructor(private readonly bitcoinNetwork: Network) {}

    private readonly p2wpkhEstimationFinalizer: NonNullable<
        Parameters<bitcoin.Psbt['finalizeInput']>[1]
    > = () => ({
        finalScriptWitness: witnessStackToScriptWitness(P2WPKH_ESTIMATION_WITNESS),
        finalScriptSig: undefined
    });

    public buildPsbt({ inputs, outputs }: PsbtRequest): bitcoin.Psbt {
        const psbt = new bitcoin.Psbt({ network: this.bitcoinNetwork });

        inputs.forEach(utxo => {
            this.assertSpendableUtxo(utxo);

            const script = bitcoin.address.toOutputScript(utxo.address, this.bitcoinNetwork);
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: { script, value: BigInt(utxo.value) }
            });
        });

        outputs.forEach(o => {
            if (!BtcAddress.validate(o.address, this.bitcoinNetwork)) {
                throw new Error(`invalid output address: ${o.address}`);
            }
            psbt.addOutput({ address: o.address, value: o.value });
        });

        return psbt;
    }

    public calculateTransactionVSize(req: PsbtRequest): bigint {
        const psbt = this.buildPsbt(req);

        req.inputs.forEach((_, i) => psbt.finalizeInput(i, this.p2wpkhEstimationFinalizer));

        return BigInt(psbt.extractTransaction().virtualSize());
    }

    private assertSpendableUtxo(
        utxo: BtcApiUtxo
    ): asserts utxo is BtcApiUtxo & { address: string } {
        if (!utxo.address) {
            throw new Error('invalid address');
        }

        if (BtcAddress.type(utxo.address) !== 'P2WPKH') {
            throw new Error(`unsupported utxo type: only P2WPKH inputs are supported`);
        }
    }
}
