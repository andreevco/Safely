import { HDKey } from '@scure/bip32';
import { getAddress, NETWORK, Transaction } from '@scure/btc-signer';
import { describe, it, expect } from 'vitest';

import type { BtcApiUtxo } from '../../../../src/api/btc';
import { BtcPsbtBuilder } from '../../../../src/blockchain-api/btc/btc-psbt-builder';
import { BtcNetwork } from '../../../../src/entities/blockchain';
import type {
    ILedgerSessionPort,
    LedgerAccountContext
} from '../../../../src/entities/signer/btc/I-ledger-session-port';
import { LedgerBtcSigner } from '../../../../src/entities/signer/btc/ledger-btc-signer';

const masterNode = HDKey.fromMasterSeed(new Uint8Array(64).fill(7));
const accountNode = masterNode.derive("m/84'/0'/0'");
const leaf = accountNode.deriveChild(0).deriveChild(0);

const XPUB = accountNode.publicExtendedKey;
const MASTER_FINGERPRINT = masterNode.fingerprint.toString(16).padStart(8, '0');
const WALLET_ADDR = getAddress('wpkh', leaf.privateKey!, NETWORK);
const RECIPIENT_ADDR = getAddress(
    'wpkh',
    accountNode.deriveChild(0).deriveChild(1).privateKey!,
    NETWORK
);
const INPUT_VALUE = '100000';

const context: LedgerAccountContext = {
    accountIndex: 0,
    xpub: XPUB,
    masterFingerprint: MASTER_FINGERPRINT,
    network: BtcNetwork.MAINNET
};

function fundingInput(): { utxo: BtcApiUtxo; prevTxs: Map<string, Uint8Array> } {
    const prev = new Transaction({ allowUnknownInputs: true, allowUnknownOutputs: true });
    prev.addOutputAddress(WALLET_ADDR, BigInt(INPUT_VALUE), NETWORK);
    prev.addInput({
        txid: new Uint8Array(32).fill(1),
        index: 0,
        finalScriptWitness: [new Uint8Array(72), new Uint8Array(33)]
    });

    const utxo = {
        txid: prev.id,
        vout: 0,
        value: INPUT_VALUE,
        confirmations: 5,
        address: WALLET_ADDR
    } as BtcApiUtxo;

    return { utxo, prevTxs: new Map([[prev.id, prev.toBytes(true, true)]]) };
}

function buildPsbt(outputValue: bigint) {
    const { utxo, prevTxs } = fundingInput();
    return new BtcPsbtBuilder(NETWORK).buildPsbt(
        {
            inputs: [utxo],
            outputs: [{ address: RECIPIENT_ADDR, value: outputValue }]
        },
        prevTxs
    );
}

function realPartialSignature(outputValue: bigint) {
    const reference = buildPsbt(outputValue);
    reference.signIdx(leaf.privateKey!, 0);
    const [pubkey, signature] = reference.getInput(0).partialSig![0];

    return { inputIndex: 0, pubkey, signature };
}

function portReturning(signatures: unknown): ILedgerSessionPort {
    return {
        withSession: <T>(_params: { expectedFingerprint: string }) =>
            Promise.resolve(signatures as T)
    };
}

describe('LedgerBtcSigner.sign', () => {
    it('enriches, signs via the session port, finalizes and extracts', async () => {
        const signature = realPartialSignature(99_800n);

        const signed = await new LedgerBtcSigner(context, portReturning([signature])).sign({
            psbt: buildPsbt(99_800n),
            utxos: [{ derivationPath: { change: 0, addressIndex: 0 } }]
        });

        expect(Buffer.isBuffer(signed)).toBe(true);
        expect(signed.length).toBeGreaterThan(0);
        expect(Transaction.fromRaw(signed).getInput(0).finalScriptWitness).toBeDefined();
    });

    it('rejects a non-partial (musig) signature', async () => {
        const port = portReturning([
            {
                inputIndex: 0,
                participantPubkey: new Uint8Array(33),
                aggregatedPubkey: new Uint8Array(33),
                tapleafHash: new Uint8Array(32),
                pubnonce: new Uint8Array(66)
            }
        ]);

        await expect(
            new LedgerBtcSigner(context, port).sign({
                psbt: buildPsbt(99_000n),
                utxos: [{ derivationPath: { change: 0, addressIndex: 0 } }]
            })
        ).rejects.toThrow(/Unexpected signature type/);
    });
});
