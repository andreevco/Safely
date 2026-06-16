/* eslint-disable @typescript-eslint/unbound-method */

import { Address, NETWORK } from '@scure/btc-signer';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ellipsisMiddle } from '../../../src';
import type { BtcApi, BtcApiUtxo } from '../../../src/api/btc';
import { BtcTransactionTemplate } from '../../../src/blockchain-api/btc/btc-transaction-template';
import { BtcSendDustError } from '../../../src/blockchain-api/btc/errors';
import type { BtcEstimation } from '../../../src/blockchain-api/btc/types';
import { BtcFeeType } from '../../../src/blockchain-api/btc/types';
import type { ExplorerFactory, SignableBtcWallet } from '../../../src/entities';
import { BtcAssetAmount } from '../../../src/entities/asset';
import { BtcNetwork, BLOCKCHAIN_NAME } from '../../../src/entities/blockchain';
import { PortfolioNetworkType } from '../../../src/entities/portfolio/portfolio-network-type';
import type { BtcSigningRequest } from '../../../src/entities/signer';

const mainnet = NETWORK;

function p2wpkhAddress(hashByte: number): string {
    return Address(mainnet).encode({ type: 'wpkh', hash: new Uint8Array(20).fill(hashByte) });
}

const WALLET_ADDR = p2wpkhAddress(0x11);
const RECIPIENT_ADDR = p2wpkhAddress(0x22);
const TXID = 'a'.repeat(64);

function makeUtxo(overrides: Partial<BtcApiUtxo> = {}): BtcApiUtxo {
    return {
        txid: TXID,
        vout: 0,
        value: '100000',
        confirmations: 5,
        address: WALLET_ADDR,
        path: "m/84'/0'/0'/0/0",
        ...overrides
    };
}

function makeWallet(overrides: Partial<SignableBtcWallet> = {}): SignableBtcWallet {
    return {
        address: WALLET_ADDR,
        network: BtcNetwork.MAINNET,
        sign: vi.fn(),
        // The template only touches address/network/sign; cast the rest.
        ...overrides
    } as unknown as SignableBtcWallet;
}

function makeApi(overrides: Partial<BtcApi> = {}): BtcApi {
    return {
        sendTransaction: vi.fn(),
        ...overrides
    } as unknown as BtcApi;
}

function makeEstimation(feeWei: bigint): BtcEstimation {
    return {
        fee: { type: 'crypto', amount: BtcAssetAmount.fromWeiAmount(feeWei) },
        feeType: BtcFeeType.FAST,
        txTargetBlock: 2
    };
}

describe('BtcTransactionTemplate', () => {
    let wallet: SignableBtcWallet;
    let api: BtcApi;

    beforeEach(() => {
        wallet = makeWallet();
        api = makeApi();
    });

    describe('outputs', () => {
        it('returns a single recipient output when hasChange = false', () => {
            const utxos = [makeUtxo({ value: '50000' })];
            const tpl = new BtcTransactionTemplate(
                api,
                wallet,
                {
                    recipientAddress: RECIPIENT_ADDR,
                    amount: BtcAssetAmount.fromWeiAmount(40000n),
                    hasChange: false
                },
                utxos,
                makeEstimation(10000n)
            );

            expect(tpl.outputs).toEqual([{ address: RECIPIENT_ADDR, value: 40000n }]);
        });

        it('appends a change output to the wallet address when hasChange = true', () => {
            const utxos = [makeUtxo({ value: '100000' })];
            const tpl = new BtcTransactionTemplate(
                api,
                wallet,
                {
                    recipientAddress: RECIPIENT_ADDR,
                    amount: BtcAssetAmount.fromWeiAmount(40000n),
                    hasChange: true
                },
                utxos,
                makeEstimation(1500n)
            );

            // change = total - amount - fee = 100000 - 40000 - 1500 = 58500
            expect(tpl.outputs).toEqual([
                { address: RECIPIENT_ADDR, value: 40000n },
                { address: WALLET_ADDR, value: 58500n }
            ]);
        });

        it('sums multiple UTXOs into change when hasChange = true', () => {
            const utxos = [
                makeUtxo({ value: '30000', vout: 0 }),
                makeUtxo({ value: '70000', vout: 1 })
            ];
            const tpl = new BtcTransactionTemplate(
                api,
                wallet,
                {
                    recipientAddress: RECIPIENT_ADDR,
                    amount: BtcAssetAmount.fromWeiAmount(40000n),
                    hasChange: true
                },
                utxos,
                makeEstimation(1500n)
            );

            // change = 100000 - 40000 - 1500 = 58500
            expect(tpl.outputs[1].value).toBe(58500n);
        });
    });

    describe('inputs', () => {
        it('exposes the UTXOs as inputs', () => {
            const utxos = [makeUtxo({ vout: 0 }), makeUtxo({ vout: 1 })];
            const tpl = new BtcTransactionTemplate(
                api,
                wallet,
                {
                    recipientAddress: RECIPIENT_ADDR,
                    amount: BtcAssetAmount.fromWeiAmount(1000n),
                    hasChange: false
                },
                utxos,
                makeEstimation(100n)
            );

            expect(tpl.inputs).toBe(utxos);
        });
    });

    describe('send', () => {
        function makeTemplate(estimationFee = 1500n) {
            const utxos = [makeUtxo({ value: '50000' })];
            return new BtcTransactionTemplate(
                api,
                wallet,
                {
                    recipientAddress: RECIPIENT_ADDR,
                    amount: BtcAssetAmount.fromWeiAmount(40000n),
                    hasChange: true
                },
                utxos,
                makeEstimation(estimationFee)
            );
        }

        it('signs the PSBT, broadcasts the result and returns a send result', async () => {
            const signedHex = 'deadbeef';
            const txid = 'tx-1234567890abcdef';
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(
                Buffer.from(signedHex, 'hex')
            );
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({
                txid
            });

            const tpl = makeTemplate();
            const result = await tpl.send();

            expect(wallet.sign).toHaveBeenCalledTimes(1);
            const signArg = (wallet.sign as ReturnType<typeof vi.fn>).mock
                .calls[0][0] as BtcSigningRequest;
            expect(signArg.psbt).toBeDefined();
            expect(signArg.utxos).toEqual([{ derivationPath: { change: 0, addressIndex: 0 } }]);

            expect(api.sendTransaction).toHaveBeenCalledTimes(1);
            expect(api.sendTransaction).toHaveBeenCalledWith(signedHex);

            expect(result.txId).toBe('tx-1234567890abcdef');
            expect(result.toString()).toBe(ellipsisMiddle(txid, 6));
        });

        it('passes the wallet-network PSBT to the signer (recipient address is honored)', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0xab]));
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ txid: 'tx-1' });

            await makeTemplate().send();
            const psbt = (
                (wallet.sign as ReturnType<typeof vi.fn>).mock.calls[0][0] as BtcSigningRequest
            ).psbt;
            // recipient output + change output
            expect(psbt.outputsLength).toBe(2);
            expect(psbt.getOutputAddress(0)).toBe(RECIPIENT_ADDR);
            expect(psbt.getOutputAddress(1)).toBe(WALLET_ADDR);
        });

        it('caches sendResult and rejects a second send call', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0]));
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ txid: 'tx-1' });

            const tpl = makeTemplate();
            const first = await tpl.send();
            expect(tpl.sendResult).toBe(first);

            await expect(tpl.send()).rejects.toThrow(/already published/);
            expect(api.sendTransaction).toHaveBeenCalledTimes(1);
        });

        it('rejects an overlapping in-flight send call', async () => {
            let resolveSign: (v: Buffer) => void = () => {};
            (wallet.sign as ReturnType<typeof vi.fn>).mockImplementation(
                () =>
                    new Promise<Buffer>(res => {
                        resolveSign = res;
                    })
            );
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ txid: 'tx-1' });

            const tpl = makeTemplate();
            const inFlight = tpl.send();

            await expect(tpl.send()).rejects.toThrow(/in progress/);

            resolveSign(Buffer.from([0]));
            await inFlight;
        });

        it('translates "dust" broadcast errors into BtcSendDustError', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0]));
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error('mempool rejected: dust')
            );

            await expect(makeTemplate().send()).rejects.toBeInstanceOf(BtcSendDustError);
        });

        it('re-throws non-dust broadcast errors verbatim', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0]));
            const original = new Error('connection refused');
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(original);

            await expect(makeTemplate().send()).rejects.toBe(original);
        });

        it('clears the in-progress flag even when send() throws', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0]));
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error('first call fails')
            );

            const tpl = makeTemplate();
            await expect(tpl.send()).rejects.toThrow(/first call fails/);

            // After a failure the template is reusable for another attempt.
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                txid: 'tx-recover'
            });
            const ok = await tpl.send();
            expect(ok.txId).toBe('tx-recover');
        });

        it('returns a result whose toExplorerUrl delegates to the supplied factory', async () => {
            (wallet.sign as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from([0]));
            (api.sendTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({
                txid: 'tx-explore'
            });

            const result = await makeTemplate().send();

            const explorerFactory = {
                createExplorer: vi.fn().mockReturnValue({
                    transaction: vi.fn().mockReturnValue('https://explorer.test/tx/tx-explore')
                })
            } as unknown as ExplorerFactory;

            expect(result.toExplorerUrl(explorerFactory)).toBe(
                'https://explorer.test/tx/tx-explore'
            );
            expect(explorerFactory.createExplorer).toHaveBeenCalledWith(
                BLOCKCHAIN_NAME.BTC,
                PortfolioNetworkType.MAINNET
            );
        });
    });
});
