import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BtcTransactionTemplate, getUtxoTotal, notNullish } from '@safely/core';
import { BtcApiTx, BtcApiUtxoWithTx } from '@safely/core/api/btc';

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
            vin: this.inputs.map((u, i) => ({
                txid: u.txid,
                vout: u.vout,
                n: i,
                addresses: [u.address],
                isAddress: true,
                isOwn: u.address === walletAddress,
                value: u.value
            })),
            vout: this.outputs.map((o, i) => ({
                value: o.value,
                n: i,
                addresses: [o.address],
                isAddress: true,
                isOwn: o.address === walletAddress
            })),
            blockHeight: -1,
            confirmations: 0,
            blockTime: 0,
            value: this.outputs.reduce((sum, o) => sum + BigInt(o.value), 0n).toString(),
            valueIn: getUtxoTotal(this.inputs).weiAmount.toString(),
            fees: this.fee
        };
    }

    public toJSON(): SPendingBtcTx {
        return this;
    }
}

export class PendingBtcTxsService {
    private readonly outgoingPendingTxs: PendingBtcTx[];
    private readonly incomingPendingTxs: PendingBtcTx[];

    public readonly resolvedTxs: string[];

    constructor(
        pendingTxs: PendingBtcTx[],
        private readonly walletAddress: string,
        ...serverTxIds: ({ txid: string }[] | undefined)[]
    ) {
        const serverTxIdsSet = new Set(
            serverTxIds
                .flat()
                .map(tx => tx?.txid)
                .filter(notNullish)
        );
        this.resolvedTxs = pendingTxs.filter(tx => serverTxIdsSet.has(tx.txId)).map(tx => tx.txId);

        pendingTxs = pendingTxs.filter(tx => !this.resolvedTxs.includes(tx.txId));

        this.outgoingPendingTxs = pendingTxs.filter(t =>
            t.inputs.some(u => u.address === walletAddress)
        );
        this.incomingPendingTxs = pendingTxs.filter(t =>
            t.outputs.some(o => o.address === walletAddress)
        );
    }

    public toUnconfirmedOut(serverUnconfirmedOut: BtcApiTx[]): BtcApiTx[] {
        const existingTxIds = new Set(serverUnconfirmedOut.map(tx => tx.txid));
        const newTxs = this.outgoingPendingTxs
            .filter(tx => !existingTxIds.has(tx.txId))
            .map(tx => tx.toBtcApiTx(this.walletAddress));
        return [...serverUnconfirmedOut, ...newTxs];
    }

    public toUnconfirmedInSafe(serverSafe: BtcApiUtxoWithTx[]): BtcApiUtxoWithTx[] {
        const existingTxIds = new Set(serverSafe.map(u => u.txid));

        const newUtxos = this.incomingPendingTxs
            .map(pending => {
                if (existingTxIds.has(pending.txId)) {
                    return null;
                }

                const ownOutputIndex = pending.outputs.findIndex(
                    o => o.address === this.walletAddress
                );
                if (ownOutputIndex === -1) {
                    return null;
                }

                const output = pending.outputs[ownOutputIndex];
                return {
                    txid: pending.txId,
                    vout: ownOutputIndex,
                    value: output.value,
                    confirmations: 0,
                    address: this.walletAddress,
                    tx: pending.toBtcApiTx(this.walletAddress)
                };
            })
            .filter(notNullish);

        return [...serverSafe, ...newUtxos];
    }
}
