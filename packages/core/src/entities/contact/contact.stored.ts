import * as z from 'zod';

import { ContactId } from './contact-id';
import { sContactMeta } from './contact-meta.stored';
import { zArrayWithKey } from '../../../../sync/src/crdt/deep-merge/array-registry';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

const sBlockchainType = z.enum(BLOCKCHAIN_NAME);

export const sContact = z.object({
    id: z.object({ hash: z.string() }).transform(val => new ContactId(val.hash)),
    addresses: zArrayWithKey(
        z.object({
            blockchain: sBlockchainType,
            address: z.string()
        }),
        item => item.address
    ),
    meta: sContactMeta,
    createdAt: z.number()
});

export type SContactOut = z.output<typeof sContact>;
export type SContactIn = z.input<typeof sContact>;
