import { z } from 'zod';

import { zIndexedArray, zIndexedObject } from '@safely/slottree';

export const sContactMeta = z.object({
    name: z.string(),
    color: z.string()
});

export const sContactAddress = zIndexedObject(
    {
        address: z.string()
    },
    value => value.address
);

export const sContact = zIndexedObject(
    {
        id: z.string(),
        addresses: zIndexedArray(sContactAddress),
        meta: sContactMeta,
        createdAt: z.number()
    },
    value => value.id
);

export type SContact = z.infer<typeof sContact>;
export type SContactAddress = z.infer<typeof sContactAddress>;

export const sContacts = zIndexedArray(sContact).nullable();
export type SContacts = z.infer<typeof sContacts>;
