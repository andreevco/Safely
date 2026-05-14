import { z } from 'zod';

import { zIndexedArray, zIndexedObject } from '@safely/slottree';

export const sContactMeta = z.object({
    name: z.string(),
    color: z.string()
});

export const sContact = zIndexedObject({
    id: z.string(),
    addresses: zIndexedArray(
        zIndexedObject({
            address: z.string()
        })
    ),
    meta: sContactMeta,
    createdAt: z.number()
});

export type SContact = z.infer<typeof sContact>;

export const sContacts = zIndexedArray(sContact).nullable();
export type SContacts = z.infer<typeof sContacts>;
