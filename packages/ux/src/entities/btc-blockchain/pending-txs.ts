import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BtcApiUtxo, BtcTransactionTemplate } from '@safely/core';
import { BtcApiTx, BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import { pendingBtcTxs } from './keys';
import { useAccountLocalStorage, useBtcApi } from '../../shared';
import { SPendingBtcTx } from '../../shared/storage/account/local/schemas';
import { useActiveAccount } from '../account';

export function usePendingBtcTransaction() {
    const { get, set } = useAccountLocalStorage('pendingBtcTxs');
    const account = useActiveAccount();
    const btcApi = useBtcApi();

    return useQuery({
        queryKey: pendingBtcTxs.account(account).toKey(),
        async queryFn() {
            const pending = (await get()) ?? null;
            if (!pending) return null;

            try {
                await btcApi.getTransaction(pending.txId);
                await set(null);
                return null;
            } catch {
                return pending;
            }
        },
        refetchInterval: ({ state }) => (state.data ? 2000 : false)
    });
}

export function useSetPendingBtcTransaction() {
    const { get, set } = useAccountLocalStorage('pendingBtcTxs');
    const queryClient = useQueryClient();
    const account = useActiveAccount();

    return useMutation({
        async mutationFn(tx: PendingBtcTx) {
            const existing = await get();
            if (existing) {
                throw new Error('Pending BTC transaction already exists');
            }
            await set(tx);
        },
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: pendingBtcTxs.account(account).toKey()
            });
        }
    });
}

export class PendingBtcTx {
    public static fromTransactionTemplate(template: BtcTransactionTemplate) {
        if (!template.sendResult) {
            throw new Error('Transaction is not published');
        }

        return new PendingBtcTx({
            txId: template.sendResult.txId,
            timestamp: Date.now(),
            inputs: template.inputs.map(u => ({
                txid: u.txid,
                vout: u.vout,
                value: u.value,
                address: u.address!
            })),
            outputs: template.outputs.map(o => ({ address: o.address, value: o.value.toString() })),
            fee: template.estimation.fee.amount.weiAmount.toString()
        });
    }

    public readonly txId: string;
    public readonly timestamp: number;
    public readonly inputs: { txid: string; vout: number; value: string; address: string }[];
    public readonly outputs: { address: string; value: string }[];
    public readonly fee: string;

    constructor(val: SPendingBtcTx) {
        this.txId = val.txId;
        this.timestamp = val.timestamp;
        this.inputs = val.inputs;
        this.outputs = val.outputs;
        this.fee = val.fee;
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

    public toJSON(): SPendingBtcTx {
        return this;
    }
}

export class PendingBtcTxsService {
    constructor(
        private readonly pendingTx: PendingBtcTx | null,
        private readonly walletAddress: string
    ) {}

    public toConfirmed(serverConfirmed: BtcApiUtxo[]): BtcApiUtxo[] {
        if (!this.pendingTx) return serverConfirmed;

        const spentKeys = new Set(this.pendingTx.inputs.map(i => `${i.txid}:${i.vout}`));

        return serverConfirmed.filter(utxo => !spentKeys.has(`${utxo.txid}:${utxo.vout}`));
    }

    public toUnconfirmedSafe(serverSafe: BtcApiUtxoWithOptionalTx[]): BtcApiUtxo[] {
        if (!this.pendingTx) return serverSafe;

        const existingKeys = new Set(serverSafe.map(u => `${u.txid}:${u.vout}`));
        const newUtxos: BtcApiUtxoWithOptionalTx[] = [];
        const btcApiTx = this.pendingTx.toBtcApiTx(this.walletAddress);

        this.pendingTx.outputs.forEach((output, vout) => {
            if (output.address !== this.walletAddress) return;

            const key = `${this.pendingTx!.txId}:${vout}`;
            if (existingKeys.has(key)) return;

            existingKeys.add(key);
            newUtxos.push({
                txid: this.pendingTx!.txId,
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
