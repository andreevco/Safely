import z from 'zod';

import { PendingBtcTx } from '../../../../../entities';

const sBtcTxOutput = z.object({
    address: z.string(),
    value: z.string()
});

const sPendingBtcTxSpentUtxo = z.object({
    txid: z.string(),
    vout: z.number(),
    value: z.string()
});

const sPendingBtcTx = z.object({
    txId: z.string(),
    timestamp: z.number(),
    senderAddress: z.string(),
    recipientAddress: z.string(),
    inputs: z.array(sPendingBtcTxSpentUtxo),
    outputs: z.array(sBtcTxOutput),
    fee: z.string()
});

export const sPendingBtcTxsSchema = z.union([
    z.null(),
    z.array(sPendingBtcTx).transform(val => val.map(v => new PendingBtcTx(v)))
]);

export type SPendingBtcTx = z.input<typeof sPendingBtcTx>;
