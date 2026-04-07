import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BtcApiUtxo, BtcTransactionTemplate } from '@safely/core';
import { BtcApiTx, BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import { pendingBtcTxs } from './keys';
import { useAccountLocalStorage } from '../../shared';
import { SPendingBtcTx } from '../../shared/storage/account/local/schemas';
import { useActiveAccount } from '../account';

export function usePendingBtcTransactions() {
    const { get } = useAccountLocalStorage('pendingBtcTxs');
    const account = useActiveAccount();

    return useQuery({
        queryKey: pendingBtcTxs.account(account).toKey(),
        async queryFn() {
            return (await get()) ?? [];
        }
    });
}

export function useAddPendingBtcTransaction() {
    const { get, set } = useAccountLocalStorage('pendingBtcTxs');
    const queryClient = useQueryClient();
    const account = useActiveAccount();

    return useMutation({
        async mutationFn(tx: PendingBtcTx) {
            const current = (await get()) ?? [];
            await set([...current, tx]);
        },
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: pendingBtcTxs.account(account).toKey()
            });
        }
    });
}

export function useRemovePendingBtcTransactions() {
    const { get, set } = useAccountLocalStorage('pendingBtcTxs');
    const queryClient = useQueryClient();
    const account = useActiveAccount();

    return useMutation({
        async mutationFn(txIds: string[]) {
            if (txIds.length === 0) return;
            const current = (await get()) ?? [];
            await set(current.filter(tx => !txIds.includes(tx.txId)));
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
        private readonly pendingTxs: PendingBtcTx[],
        private readonly walletAddress: string
    ) {}

    public toConfirmed(serverConfirmed: BtcApiUtxo[]): BtcApiUtxo[] {
        const spentKeys = new Set(
            this.pendingTxs.flatMap(tx => tx.inputs.map(i => `${i.txid}:${i.vout}`))
        );

        return serverConfirmed.filter(utxo => !spentKeys.has(`${utxo.txid}:${utxo.vout}`));
    }

    public toUnconfirmedSafe(serverSafe: BtcApiUtxoWithOptionalTx[]): BtcApiUtxo[] {
        const existingKeys = new Set(serverSafe.map(u => `${u.txid}:${u.vout}`));
        const newUtxos: BtcApiUtxoWithOptionalTx[] = [];

        for (const pendingTx of this.pendingTxs) {
            const btcApiTx = pendingTx.toBtcApiTx(this.walletAddress);

            pendingTx.outputs.forEach((output, vout) => {
                if (output.address !== this.walletAddress) return;

                const key = `${pendingTx.txId}:${vout}`;
                if (existingKeys.has(key)) return;

                existingKeys.add(key);
                newUtxos.push({
                    txid: pendingTx.txId,
                    vout,
                    value: output.value,
                    confirmations: 0,
                    address: output.address,
                    tx: btcApiTx
                });
            });
        }

        return [...serverSafe, ...newUtxos];
    }
}
