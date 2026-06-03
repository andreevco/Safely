import { HDKey } from '@scure/bip32';
import { getAddress, NETWORK } from '@scure/btc-signer';
import { describe, it, expect } from 'vitest';

import type { BtcApiUtxo } from '../../../../src/api/btc';
import { BtcPsbtBuilder } from '../../../../src/blockchain-api/btc/btc-psbt-builder';
import type { IBtcNodeProducer } from '../../../../src/entities/derivation/btc/I-btc-node-producer';
import { BtcKeypairSigner } from '../../../../src/entities/signer/btc/btc-keypair-signer';

// A deterministic HD tree so the input address matches the key the signer derives.
const portfolioNode = HDKey.fromMasterSeed(new Uint8Array(64).fill(7));
const signingChild = portfolioNode.deriveChild(0).deriveChild(0);

const WALLET_ADDR = getAddress('wpkh', signingChild.privateKey!, NETWORK);
const RECIPIENT_ADDR = getAddress(
    'wpkh',
    portfolioNode.deriveChild(0).deriveChild(1).privateKey!,
    NETWORK
);
const TXID = 'a'.repeat(64);

const nodeProducer: IBtcNodeProducer = {
    getPortfolioDerivation: () => Promise.resolve(portfolioNode)
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

function sign(inputValue: string, outputValue: bigint): Promise<Buffer> {
    const psbt = new BtcPsbtBuilder(NETWORK).buildPsbt({
        inputs: [utxo(inputValue)],
        outputs: [{ address: RECIPIENT_ADDR, value: outputValue }]
    });

    return new BtcKeypairSigner(nodeProducer).sign({
        psbt,
        utxos: [{ derivationPath: { change: 0, addressIndex: 0 } }]
    });
}

describe('BtcKeypairSigner absurd-fee guard', () => {
    it('signs and extracts a transaction with a reasonable fee', async () => {
        // 100_000 in, 99_800 out → 200 sat fee over ~110 vB ≈ 2 sat/vB.
        const signed = await sign('100000', 99_800n);

        expect(Buffer.isBuffer(signed)).toBe(true);
        expect(signed.length).toBeGreaterThan(0);
    });

    it('refuses to sign when the implied fee rate exceeds the safety limit', async () => {
        // 1 BTC in, 1 sat out → ~909_000 sat/vB, far above the 5000 sat/vB cap.
        await expect(sign('100000000', 1n)).rejects.toThrow(/exceeds the 5000 sat\/vB/);
    });
});
