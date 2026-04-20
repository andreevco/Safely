import * as z from 'zod';

import { ContactId } from './contact-id';
import { sContactMeta } from './contact-meta.stored';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export const sContact = z.object({
    id: z.object({ hash: z.string() }).transform(val => new ContactId(val.hash)),
    blockchain: z.enum(BLOCKCHAIN_NAME),
    address: z.string(),
    meta: sContactMeta,
    createdAt: z.number()
});

export type SContactOut = z.output<typeof sContact>;
export type SContactIn = z.input<typeof sContact>;
