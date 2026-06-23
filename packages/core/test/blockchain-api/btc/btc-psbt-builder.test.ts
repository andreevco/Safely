import { Address, NETWORK, OutScript, TEST_NETWORK, Transaction } from '@scure/btc-signer';
import type { BTC_NETWORK } from '@scure/btc-signer/utils.js';
import { describe, it, expect } from 'vitest';

import type { BtcApiUtxo } from '../../../src/api/btc';
import { BtcPsbtBuilder } from '../../../src/blockchain-api/btc/btc-psbt-builder';

const mainnet = NETWORK;
const testnet = TEST_NETWORK;

function p2wpkhAddress(network: BTC_NETWORK, hashByte: number): string {
    return Address(network).encode({ type: 'wpkh', hash: new Uint8Array(20).fill(hashByte) });
}

function p2pkhAddress(network: BTC_NETWORK, hashByte: number): string {
    return Address(network).encode({ type: 'pkh', hash: new Uint8Array(20).fill(hashByte) });
}

// BIP125 opt-in RBF: sequence 0xfffffffd
const RBF_SEQUENCE = 0xfffffffd;
const TXID = 'a'.repeat(64);

const WALLET_ADDR = p2wpkhAddress(mainnet, 0x11);
const RECIPIENT_ADDR = p2wpkhAddress(mainnet, 0x22);
const RECIPIENT_ADDR_TESTNET = p2wpkhAddress(testnet, 0x33);

function utxo(overrides: Partial<BtcApiUtxo> = {}): BtcApiUtxo {
    return {
        txid: TXID,
        vout: 0,
        value: '100000',
        confirmations: 5,
        address: WALLET_ADDR,
        ...overrides
    };
}

function inputWithPrevTx(
    network: BTC_NETWORK,
    overrides: Partial<BtcApiUtxo> = {}
): { utxo: BtcApiUtxo; prevBytes: Uint8Array } {
    const base = utxo(overrides);
    const prev = new Transaction({ allowUnknownInputs: true, allowUnknownOutputs: true });
    for (let i = 0; i <= base.vout; i++) {
        prev.addOutputAddress(base.address!, BigInt(base.value), network);
    }
    prev.addInput({
        txid: new Uint8Array(32).fill(1),
        index: 0,
        finalScriptWitness: [new Uint8Array(72), new Uint8Array(33)]
    });
    const prevBytes = prev.toBytes(true, true);

    return { utxo: { ...base, txid: prev.id }, prevBytes };
}

function prevTxMap(inputs: { utxo: BtcApiUtxo; prevBytes: Uint8Array }[]): Map<string, Uint8Array> {
    return new Map(inputs.map(i => [i.utxo.txid, i.prevBytes]));
}

describe('BtcPsbtBuilder', () => {
    const builder = new BtcPsbtBuilder(mainnet);

    describe('buildPsbt', () => {
        it('builds a PSBT with given inputs and outputs', () => {
            const input = inputWithPrevTx(mainnet, { value: '50000' });
            const psbt = builder.buildPsbt(
                {
                    inputs: [input.utxo],
                    outputs: [{ address: RECIPIENT_ADDR, value: 40000n }]
                },
                prevTxMap([input])
            );

            expect(psbt.inputsLength).toBe(1);
            expect(psbt.outputsLength).toBe(1);
            expect(psbt.getOutputAddress(0, mainnet)).toBe(RECIPIENT_ADDR);
            expect(psbt.getOutput(0).amount).toBe(40000n);
        });

        it('marks every input with BIP125 RBF-enabled sequence', () => {
            const inputs = [
                inputWithPrevTx(mainnet, { vout: 0 }),
                inputWithPrevTx(mainnet, { vout: 1 })
            ];
            const psbt = builder.buildPsbt(
                {
                    inputs: inputs.map(i => i.utxo),
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                },
                prevTxMap(inputs)
            );

            for (let i = 0; i < psbt.inputsLength; i++) {
                expect(psbt.getInput(i).sequence).toBe(RBF_SEQUENCE);
            }
        });

        it('attaches witnessUtxo derived from the input address script', () => {
            const input = inputWithPrevTx(mainnet, { value: '12345' });
            const psbt = builder.buildPsbt(
                {
                    inputs: [input.utxo],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                },
                prevTxMap([input])
            );

            const dataInput = psbt.getInput(0);
            expect(dataInput.witnessUtxo).toBeDefined();
            expect(dataInput.witnessUtxo?.amount).toBe(12345n);
            const expectedScript = OutScript.encode(Address(mainnet).decode(WALLET_ADDR)!);
            expect(Buffer.from(dataInput.witnessUtxo!.script).equals(expectedScript)).toBe(true);
        });

        it('attaches nonWitnessUtxo for each input', () => {
            const input = inputWithPrevTx(mainnet, { value: '50000' });
            const psbt = builder.buildPsbt(
                {
                    inputs: [input.utxo],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                },
                prevTxMap([input])
            );

            expect(psbt.getInput(0).nonWitnessUtxo).toBeDefined();
        });

        it('throws when the previous transaction for an input is missing', () => {
            const input = inputWithPrevTx(mainnet, { value: '50000' });
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [input.utxo],
                        outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                    },
                    new Map()
                )
            ).toThrow(/missing previous transaction/);
        });

        it('throws when the previous transaction does not hash to the input txid', () => {
            const input = inputWithPrevTx(mainnet, { value: '50000' });
            const other = inputWithPrevTx(mainnet, { value: '777' });
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [input.utxo],
                        outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                    },
                    new Map([[input.utxo.txid, other.prevBytes]])
                )
            ).toThrow(/txid mismatch/);
        });

        it('throws when input UTXO has no address', () => {
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [utxo({ address: undefined })],
                        outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                    },
                    new Map()
                )
            ).toThrow(/invalid address/);
        });

        it('throws when input UTXO is a non-P2WPKH type (legacy P2PKH)', () => {
            const legacy = p2pkhAddress(mainnet, 0x44);
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [utxo({ address: legacy })],
                        outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                    },
                    new Map()
                )
            ).toThrow(/unsupported utxo type/);
        });

        it('throws when output address is invalid for the configured network', () => {
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [utxo()],
                        outputs: [{ address: RECIPIENT_ADDR_TESTNET, value: 100n }]
                    },
                    new Map()
                )
            ).toThrow(/invalid output address/);
        });

        it('throws when output address is structurally garbage', () => {
            expect(() =>
                builder.buildPsbt(
                    {
                        inputs: [utxo()],
                        outputs: [{ address: 'not-an-address', value: 100n }]
                    },
                    new Map()
                )
            ).toThrow(/invalid output address/);
        });
    });

    describe('calculateTransactionVSize', () => {
        it('returns the virtual size of the finalized P2WPKH transaction', () => {
            const vSize = builder.calculateTransactionVSize({
                inputs: [utxo()],
                outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
            });

            // A 1-in/1-out P2WPKH spend is ~110 vB (10.5 base + ~67.75 input + ~31 output).
            expect(typeof vSize).toBe('bigint');
            expect(vSize).toBeGreaterThan(100n);
            expect(vSize).toBeLessThan(120n);
        });

        it('vSize grows with additional outputs', () => {
            const oneOut = builder.calculateTransactionVSize({
                inputs: [utxo()],
                outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
            });
            const twoOut = builder.calculateTransactionVSize({
                inputs: [utxo()],
                outputs: [
                    { address: RECIPIENT_ADDR, value: 1n },
                    { address: WALLET_ADDR, value: 1n }
                ]
            });

            expect(twoOut).toBeGreaterThan(oneOut);
            // Each P2WPKH output adds 31 vbytes.
            expect(twoOut - oneOut).toBe(31n);
        });

        it('vSize grows with additional inputs', () => {
            const oneIn = builder.calculateTransactionVSize({
                inputs: [utxo({ vout: 0 })],
                outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
            });
            const twoIn = builder.calculateTransactionVSize({
                inputs: [utxo({ vout: 0 }), utxo({ vout: 1 })],
                outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
            });

            expect(twoIn).toBeGreaterThan(oneIn);
            // Each P2WPKH input adds ~68 vbytes.
            expect(twoIn - oneIn).toBeGreaterThan(60n);
            expect(twoIn - oneIn).toBeLessThan(80n);
        });

        it('vSize does not depend on the literal output value (only on script type)', () => {
            // Output value is serialized as a fixed 8-byte field, so vSize must be
            // identical regardless of its magnitude.
            const small = builder.calculateTransactionVSize({
                inputs: [utxo({ value: '100000' })],
                outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
            });
            const huge = builder.calculateTransactionVSize({
                inputs: [utxo({ value: '100000' })],
                outputs: [{ address: RECIPIENT_ADDR, value: 99_999n }]
            });
            expect(small).toBe(huge);
        });

        it('estimates vSize even when inputs >> outputs (large implied fee)', () => {
            expect(() =>
                builder.calculateTransactionVSize({
                    inputs: [utxo({ value: '130000000' })],
                    outputs: [{ address: RECIPIENT_ADDR, value: 1n }]
                })
            ).not.toThrow();
        });

        it('also rejects non-P2WPKH inputs during vSize estimation', () => {
            const legacy = p2pkhAddress(mainnet, 0x55);
            expect(() =>
                builder.calculateTransactionVSize({
                    inputs: [utxo({ address: legacy })],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                })
            ).toThrow(/unsupported utxo type/);
        });
    });

    describe('network isolation', () => {
        it('a testnet builder accepts testnet addresses and rejects mainnet ones', () => {
            const testnetBuilder = new BtcPsbtBuilder(testnet);
            const testnetInput = inputWithPrevTx(testnet, {
                address: p2wpkhAddress(testnet, 0x11)
            });

            // testnet recipient is accepted
            expect(() =>
                testnetBuilder.buildPsbt(
                    {
                        inputs: [testnetInput.utxo],
                        outputs: [{ address: RECIPIENT_ADDR_TESTNET, value: 100n }]
                    },
                    prevTxMap([testnetInput])
                )
            ).not.toThrow();

            // mainnet recipient is rejected
            expect(() =>
                testnetBuilder.buildPsbt(
                    {
                        inputs: [testnetInput.utxo],
                        outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                    },
                    prevTxMap([testnetInput])
                )
            ).toThrow(/invalid output address/);
        });
    });
});
