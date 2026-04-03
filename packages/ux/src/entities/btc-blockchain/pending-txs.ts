import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BtcTransactionTemplate, getUtxoTotal } from '@safely/core';
import { BtcApiTx, BtcApiUtxo, BtcApiUtxoWithTx } from '@safely/core/api/btc';

import { pendingBtcTxs } from './keys';
import { useAccountLocalStorage } from '../../shared/storage/account/local';
import { SPendingBtcTx } from '../../shared/storage/account/local/schemas/pending-btc-txs.schema';
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
            senderAddress: template.wallet.address,
            recipientAddress: template.request.recipientAddress,
            inputs: template.inputs.map(u => ({ txid: u.txid, vout: u.vout, value: u.value })),
            outputs: template.outputs.map(o => ({ address: o.address, value: o.value.toString() })),
            fee: template.estimation.fee.amount.weiAmount.toString()
        });
    }

    public readonly txId: string;
    public readonly timestamp: number;
    public readonly senderAddress: string;
    public readonly recipientAddress: string;
    public readonly inputs: { txid: string; vout: number; value: string }[];
    public readonly outputs: { address: string; value: string }[];
    public readonly fee: string;

    constructor(val: SPendingBtcTx) {
        this.txId = val.txId;
        this.timestamp = val.timestamp;
        this.senderAddress = val.senderAddress;
        this.recipientAddress = val.recipientAddress;
        this.inputs = val.inputs;
        this.outputs = val.outputs;
        this.fee = val.fee;
    }

    public toBtcApiTx(walletAddress: string): BtcApiTx {
        const isSender = walletAddress === this.senderAddress;

        return {
            txid: this.txId,
            vin: this.inputs.map((u, i) => ({
                txid: u.txid,
                vout: u.vout,
                n: i,
                addresses: [this.senderAddress],
                isAddress: true,
                isOwn: isSender,
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

export function pendingTxsForWallet(
    allPendingTxs: PendingBtcTx[],
    walletAddress: string
): { outgoing: PendingBtcTx[]; incoming: PendingBtcTx[] } {
    const outgoing: PendingBtcTx[] = [];
    const incoming: PendingBtcTx[] = [];

    for (const tx of allPendingTxs) {
        if (tx.senderAddress === walletAddress) {
            outgoing.push(tx);
        }
        if (tx.recipientAddress === walletAddress) {
            incoming.push(tx);
        }
    }

    return { outgoing, incoming };
}

export function patchConfirmedUtxos(
    confirmedUtxos: BtcApiUtxo[],
    outgoingPendingTxs: PendingBtcTx[]
): BtcApiUtxo[] {
    const spentSet = new Set(
        outgoingPendingTxs.flatMap(tx => tx.inputs.map(u => `${u.txid}:${u.vout}`))
    );
    return confirmedUtxos.filter(u => !spentSet.has(`${u.txid}:${u.vout}`));
}

export function patchUnconfirmedOut(
    serverUnconfirmedOut: BtcApiTx[],
    outgoingPendingTxs: PendingBtcTx[],
    walletAddress: string
): BtcApiTx[] {
    const existingTxIds = new Set(serverUnconfirmedOut.map(tx => tx.txid));
    const newTxs = outgoingPendingTxs
        .filter(tx => !existingTxIds.has(tx.txId))
        .map(tx => pendingTxToBtcApiTx(tx, walletAddress));
    return [...serverUnconfirmedOut, ...newTxs];
}

export function patchUnconfirmedInSafe(
    serverSafe: BtcApiUtxoWithTx[],
    incomingPendingTxs: PendingBtcTx[],
    walletAddress: string
): BtcApiUtxoWithTx[] {
    const existingTxIds = new Set(serverSafe.map(u => u.txid));
    const newUtxos: BtcApiUtxoWithTx[] = [];

    for (const pending of incomingPendingTxs) {
        if (existingTxIds.has(pending.txId)) continue;

        const recipientOutputIndex = pending.outputs.findIndex(o => o.address === walletAddress);
        if (recipientOutputIndex === -1) continue;

        const output = pending.outputs[recipientOutputIndex];
        newUtxos.push({
            txid: pending.txId,
            vout: recipientOutputIndex,
            value: output.value,
            confirmations: 0,
            address: walletAddress,
            tx: pendingTxToBtcApiTx(pending, walletAddress)
        });
    }

    return [...serverSafe, ...newUtxos];
}

export function resolvedPendingTxIds(
    serverTxIds: Set<string>,
    pendingTxs: PendingBtcTx[]
): string[] {
    return pendingTxs.filter(tx => serverTxIds.has(tx.txId)).map(tx => tx.txId);
}
