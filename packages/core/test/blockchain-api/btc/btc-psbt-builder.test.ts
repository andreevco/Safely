import { describe, it, expect } from 'vitest';

import type { BtcApiUtxo } from '../../../src/api/btc';
import { bitcoin } from '../../../src/blockchain-api/btc/bitcoinjs';
import { BtcPsbtBuilder } from '../../../src/blockchain-api/btc/btc-psbt-builder';

const mainnet = bitcoin.networks.bitcoin;
const testnet = bitcoin.networks.testnet;

function p2wpkhAddress(network: bitcoin.Network, hashByte: number): string {
    const { address } = bitcoin.payments.p2wpkh({
        hash: Buffer.alloc(20, hashByte),
        network
    });
    if (!address) throw new Error('failed to construct p2wpkh address');
    return address;
}

function p2pkhAddress(network: bitcoin.Network, hashByte: number): string {
    const { address } = bitcoin.payments.p2pkh({
        hash: Buffer.alloc(20, hashByte),
        network
    });
    if (!address) throw new Error('failed to construct p2pkh address');
    return address;
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

describe('BtcPsbtBuilder', () => {
    const builder = new BtcPsbtBuilder(mainnet);

    describe('buildPsbt', () => {
        it('builds a PSBT with given inputs and outputs', () => {
            const psbt = builder.buildPsbt({
                inputs: [utxo({ value: '50000' })],
                outputs: [{ address: RECIPIENT_ADDR, value: 40000n }]
            });

            expect(psbt.inputCount).toBe(1);
            expect(psbt.txOutputs).toHaveLength(1);
            expect(psbt.txOutputs[0].address).toBe(RECIPIENT_ADDR);
            expect(psbt.txOutputs[0].value).toBe(40000n);
        });

        it('marks every input with BIP125 RBF-enabled sequence', () => {
            const psbt = builder.buildPsbt({
                inputs: [utxo({ vout: 0 }), utxo({ vout: 1 })],
                outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
            });

            psbt.txInputs.forEach(input => {
                expect(input.sequence).toBe(RBF_SEQUENCE);
            });
        });

        it('attaches witnessUtxo derived from the input address script', () => {
            const psbt = builder.buildPsbt({
                inputs: [utxo({ value: '12345' })],
                outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
            });

            const dataInput = psbt.data.inputs[0];
            expect(dataInput.witnessUtxo).toBeDefined();
            expect(dataInput.witnessUtxo?.value).toBe(12345n);
            const expectedScript = bitcoin.address.toOutputScript(WALLET_ADDR, mainnet);
            expect(Buffer.from(dataInput.witnessUtxo!.script).equals(expectedScript)).toBe(true);
        });

        it('throws when input UTXO has no address', () => {
            expect(() =>
                builder.buildPsbt({
                    inputs: [utxo({ address: undefined })],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                })
            ).toThrow(/invalid address/);
        });

        it('throws when input UTXO is a non-P2WPKH type (legacy P2PKH)', () => {
            const legacy = p2pkhAddress(mainnet, 0x44);
            expect(() =>
                builder.buildPsbt({
                    inputs: [utxo({ address: legacy })],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                })
            ).toThrow(/unsupported utxo type/);
        });

        it('throws when output address is invalid for the configured network', () => {
            expect(() =>
                builder.buildPsbt({
                    inputs: [utxo()],
                    outputs: [{ address: RECIPIENT_ADDR_TESTNET, value: 100n }]
                })
            ).toThrow(/invalid output address/);
        });

        it('throws when output address is structurally garbage', () => {
            expect(() =>
                builder.buildPsbt({
                    inputs: [utxo()],
                    outputs: [{ address: 'not-an-address', value: 100n }]
                })
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

        it("does not trip bitcoinjs' absurd-fee guard when inputs >> outputs", () => {
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
            const testnetUtxo = utxo({ address: p2wpkhAddress(testnet, 0x11) });

            // testnet recipient is accepted
            expect(() =>
                testnetBuilder.buildPsbt({
                    inputs: [testnetUtxo],
                    outputs: [{ address: RECIPIENT_ADDR_TESTNET, value: 100n }]
                })
            ).not.toThrow();

            // mainnet recipient is rejected
            expect(() =>
                testnetBuilder.buildPsbt({
                    inputs: [testnetUtxo],
                    outputs: [{ address: RECIPIENT_ADDR, value: 100n }]
                })
            ).toThrow(/invalid output address/);
        });
    });
});
