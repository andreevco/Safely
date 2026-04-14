import z from 'zod';

import { BroadcastedBtcTx } from '../../../../../entities';

const sBtcTxOutput = z.object({
    address: z.string(),
    value: z.string()
});

const sBroadcastedBtcTxSpentUtxo = z.object({
    address: z.string(),
    txid: z.string(),
    vout: z.number(),
    value: z.string()
});

const sBroadcastedBtcTx = z.object({
    txId: z.string(),
    timestamp: z.number(),
    inputs: z.array(sBroadcastedBtcTxSpentUtxo),
    outputs: z.array(sBtcTxOutput),
    fee: z.string(),
    senderXpub: z.string()
});

export const sBroadcastedBtcTxCacheSchema = z.union([
    z.null(),
    sBroadcastedBtcTx.transform(val => new BroadcastedBtcTx(val))
]);

export type SBroadcastedBtcTx = z.input<typeof sBroadcastedBtcTx>;
