import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    BtcApiUtxo,
    BtcAssetAmount,
    BtcTransactionTemplate,
    toBig,
    toBigOrZero
} from '@safely/core';
import { BtcApiTx, BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import { broadcastedBtcTxCache, utxo } from './keys';
import { useAccountLocalStorage, refetchQueries } from '../../shared';
import { SBroadcastedBtcTx } from '../../shared/storage/account/local/schemas';
import { useActiveAccount } from '../account';
import { useRawBtcWalletUtxo } from './utxo';
import { getBiggestBtcIOAddress } from '../activity/api';
import { BtcActivityItem } from '../activity/types';
import { useActiveBtcWallet } from '../portfolio';

export function useBroadcastedBtcTxCache() {
    const { get, set } = useAccountLocalStorage('broadcastedBtcTxCache');
    const account = useActiveAccount();
    const client = useQueryClient();
    useRawBtcWalletUtxo(useActiveBtcWallet());

    return useQuery({
        queryKey: broadcastedBtcTxCache.account(account).toKey(),
        async queryFn() {
            const cached = (await get()) ?? null;
            if (!cached) return null;

            await refetchQueries(client, utxo.toKey());

            const serverUtxoQueries = client.getQueriesData<{ txid: string; vout: number }[]>({
                queryKey: utxo.toKey()
            });

            const allUtxos = serverUtxoQueries.flatMap(([, data]) => data ?? []);

            const spentKeys = new Set(cached.inputs.map(i => `${i.txid}:${i.vout}`));
            if (allUtxos.some(u => spentKeys.has(`${u.txid}:${u.vout}`))) {
                return cached;
            }

            await set(null);
            return null;
        },
        refetchInterval: ({ state }) => (state.data ? 2000 : false)
    });
}

export function useSetBroadcastedBtcTxCache() {
    const { get, set } = useAccountLocalStorage('broadcastedBtcTxCache');
    const queryClient = useQueryClient();
    const account = useActiveAccount();

    return useMutation({
        async mutationFn(tx: BroadcastedBtcTx) {
            const existing = await get();
            if (existing) {
                throw new Error('Broadcasted BTC transaction cache already exists');
            }
            await set(tx);
        },
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: broadcastedBtcTxCache.account(account).toKey()
            });
        }
    });
}

export class BroadcastedBtcTx {
    public static fromTransactionTemplate(template: BtcTransactionTemplate) {
        if (!template.sendResult) {
            throw new Error('Transaction is not published');
        }

        return new BroadcastedBtcTx({
            txId: template.sendResult.txId,
            timestamp: Date.now(),
            inputs: template.inputs.map(u => ({
                txid: u.txid,
                vout: u.vout,
                value: u.value,
                address: u.address!
            })),
            outputs: template.outputs.map(o => ({ address: o.address, value: o.value.toString() })),
            fee: template.estimation.fee.amount.weiAmount.toString(),
            senderXpub: template.wallet.xpub
        });
    }

    public readonly txId: string;
    public readonly timestamp: number;
    public readonly inputs: { txid: string; vout: number; value: string; address: string }[];
    public readonly outputs: { address: string; value: string }[];
    public readonly fee: string;
    public readonly senderXpub: string;

    constructor(val: SBroadcastedBtcTx) {
        this.txId = val.txId;
        this.timestamp = val.timestamp;
        this.inputs = val.inputs;
        this.outputs = val.outputs;
        this.fee = val.fee;
        this.senderXpub = val.senderXpub;
    }

    public toBtcApiTx(walletAddress: string): BtcApiTx {
        return {
            txid: this.txId,
            vin: this.inputs.map(u => ({
                txid: u.txid,
                vout: u.vout,
                addresses: [u.address],
                value: u.value,
                isOwn: u.address === walletAddress
            })),
            vout: this.outputs.map(o => ({
                value: o.value,
                addresses: [o.address],
                isOwn: o.address === walletAddress
            })),
            blockHeight: -1,
            confirmations: 0,
            blockTime: 0
        };
    }

    public toActivityItem(walletAddress: string): BtcActivityItem | null {
        const btcApiTx = this.toBtcApiTx(walletAddress);

        const isInitiator = !!btcApiTx.vin?.some(input => input.isOwn);

        const fromAddress = getBiggestBtcIOAddress(
            btcApiTx.vin.filter(v => Boolean(v.isOwn) === isInitiator)
        );
        const toAddress =
            getBiggestBtcIOAddress(btcApiTx.vout.filter(v => Boolean(v.isOwn) === !isInitiator)) ??
            getBiggestBtcIOAddress(btcApiTx.vout);

        if (!fromAddress || !toAddress) {
            return null;
        }

        const weiAmount = btcApiTx.vout
            .filter(v => Boolean(v.isOwn) === !isInitiator)
            .reduce((acc, v) => acc.plus(toBigOrZero(v.value)), toBig(0));

        return {
            timestamp: this.timestamp,
            key: btcApiTx.txid,
            transaction: {
                isInitiator,
                fromAddress,
                toAddress,
                value: BtcAssetAmount.fromWeiAmount(weiAmount),
                fee: this.fee
                    ? { type: 'crypto', amount: BtcAssetAmount.fromWeiAmount(this.fee) }
                    : undefined,
                raw: btcApiTx
            }
        };
    }

    public toJSON(): SBroadcastedBtcTx {
        return this;
    }
}

export class BroadcastedBtcTxCacheService {
    constructor(
        private readonly broadcastedTx: BroadcastedBtcTx | null,
        private readonly walletAddress: string
    ) {}

    public toConfirmed(serverConfirmed: BtcApiUtxo[]): BtcApiUtxo[] {
        if (!this.broadcastedTx) return serverConfirmed;

        const spentKeys = new Set(this.broadcastedTx.inputs.map(i => `${i.txid}:${i.vout}`));

        return serverConfirmed.filter(u => !spentKeys.has(`${u.txid}:${u.vout}`));
    }

    public toUnconfirmedSafe(serverSafe: BtcApiUtxoWithOptionalTx[]): BtcApiUtxo[] {
        if (!this.broadcastedTx) return serverSafe;

        const spentKeys = new Set(this.broadcastedTx.inputs.map(i => `${i.txid}:${i.vout}`));
        serverSafe = serverSafe.filter(u => !spentKeys.has(`${u.txid}:${u.vout}`));

        const existingKeys = new Set(serverSafe.map(u => `${u.txid}:${u.vout}`));
        const newUtxos: BtcApiUtxoWithOptionalTx[] = [];
        const btcApiTx = this.broadcastedTx.toBtcApiTx(this.walletAddress);

        this.broadcastedTx.outputs.forEach((output, vout) => {
            if (output.address !== this.walletAddress) return;

            const key = `${this.broadcastedTx!.txId}:${vout}`;
            if (existingKeys.has(key)) return;

            existingKeys.add(key);
            newUtxos.push({
                txid: this.broadcastedTx!.txId,
                vout,
                value: output.value,
                confirmations: 0,
                address: output.address,
                tx: btcApiTx
            });
        });

        return [...serverSafe, ...newUtxos];
    }
}
