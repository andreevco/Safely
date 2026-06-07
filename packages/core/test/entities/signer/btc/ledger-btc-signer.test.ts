import { DefaultDescriptorTemplate } from '@ledgerhq/device-signer-kit-bitcoin';
import { HDKey } from '@scure/bip32';
import { bip32Path, getAddress, NETWORK } from '@scure/btc-signer';
import { describe, it, expect } from 'vitest';

import type { BtcApiUtxo } from '../../../../src/api/btc';
import { BtcPsbtBuilder } from '../../../../src/blockchain-api/btc/btc-psbt-builder';
import type {
    ILedgerSessionPort,
    LedgerAccountContext
} from '../../../../src/entities/signer/btc/I-ledger-session-port';
import {
    applyLedgerSignatures,
    buildLedgerWalletPolicy,
    enrichPsbtForLedger,
    LedgerBtcSigner
} from '../../../../src/entities/signer/btc/ledger-btc-signer';

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
const TXID = 'a'.repeat(64);

const context: LedgerAccountContext = {
    accountIndex: 0,
    xpub: XPUB,
    masterFingerprint: MASTER_FINGERPRINT
};

function utxo(value: string): BtcApiUtxo {
    return {
        txid: TXID,
        vout: 0,
        value,
        confirmations: 5,
        address: WALLET_ADDR
    } as BtcApiUtxo;
}

function buildPsbt(outputValue: bigint) {
    return new BtcPsbtBuilder(NETWORK).buildPsbt({
        inputs: [utxo('100000')],
        outputs: [{ address: RECIPIENT_ADDR, value: outputValue }]
    });
}

function realPartialSignature(outputValue: bigint) {
    const reference = buildPsbt(outputValue);
    reference.signIdx(leaf.privateKey!, 0);
    const [pubkey, signature] = reference.getInput(0).partialSig![0];

    return { inputIndex: 0, pubkey, signature };
}

describe('buildLedgerWalletPolicy', () => {
    it('builds a native segwit default wallet at the account path', () => {
        const wallet = buildLedgerWalletPolicy(3);

        expect(wallet.derivationPath).toBe("84'/0'/3'");
        expect(wallet.template).toBe(DefaultDescriptorTemplate.NATIVE_SEGWIT);
    });
});

describe('enrichPsbtForLedger', () => {
    it('adds bip32 key-origin to each input', () => {
        const psbt = buildPsbt(99_000n);

        enrichPsbtForLedger(psbt, [{ derivationPath: { change: 0, addressIndex: 0 } }], context);

        const derivation = psbt.getInput(0).bip32Derivation;
        expect(derivation).toBeDefined();

        const [pubkey, origin] = derivation![0];
        expect(Buffer.from(pubkey)).toEqual(Buffer.from(leaf.publicKey!));
        expect(origin.fingerprint).toBe(masterNode.fingerprint);
        expect(origin.path).toEqual(bip32Path("m/84'/0'/0'/0/0"));
    });
});

describe('applyLedgerSignatures', () => {
    it('writes the partial signature onto the matching input', () => {
        const signature = realPartialSignature(99_000n);
        const psbt = buildPsbt(99_000n);

        applyLedgerSignatures(psbt, [signature]);

        const [pubkey, sig] = psbt.getInput(0).partialSig![0];
        expect(Buffer.from(pubkey)).toEqual(Buffer.from(signature.pubkey));
        expect(Buffer.from(sig)).toEqual(Buffer.from(signature.signature));
    });

    it('rejects a non-partial (musig) signature', () => {
        const psbt = buildPsbt(99_000n);

        expect(() =>
            applyLedgerSignatures(psbt, [
                {
                    inputIndex: 0,
                    participantPubkey: new Uint8Array(33),
                    aggregatedPubkey: new Uint8Array(33),
                    tapleafHash: new Uint8Array(32),
                    pubnonce: new Uint8Array(66)
                }
            ])
        ).toThrow(/Unexpected signature type/);
    });
});

describe('LedgerBtcSigner.sign', () => {
    it('enriches, signs via the session port, finalizes and extracts', async () => {
        const signature = realPartialSignature(99_800n);
        const port: ILedgerSessionPort = {
            withSession: <T>(_params: { expectedFingerprint: string }) =>
                Promise.resolve([signature] as unknown as T)
        };

        const signed = await new LedgerBtcSigner(context, port).sign({
            psbt: buildPsbt(99_800n),
            utxos: [{ derivationPath: { change: 0, addressIndex: 0 } }]
        });

        expect(Buffer.isBuffer(signed)).toBe(true);
        expect(signed.length).toBeGreaterThan(0);
    });
});
