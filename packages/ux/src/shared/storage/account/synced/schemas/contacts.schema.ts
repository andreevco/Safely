import { z } from 'zod';

import { ContactId, sContact } from '@safely/core';
import { orderedSet, orderedValues, toOrderedSet } from '@safely/slottree';

export { sContact, type SContactOut, type SContactIn } from '@safely/core';

export const sContacts = z.union([orderedSet(sContact), z.null()]);

type SContactIn = z.input<typeof sContact>;
type SContactOut = z.output<typeof sContact>;
export type SContactsIn = z.input<typeof sContacts>;
export type SContactsOut = z.output<typeof sContacts>;

export function getContactStorageId(item: SContactIn): string {
    return new ContactId(item.id.hash).toString();
}

export function contactsToOrderedSet(items: readonly SContactIn[]): Exclude<SContactsIn, null> {
    return toOrderedSet(items, getContactStorageId);
}

export function contactsFromOrderedSet(items: Exclude<SContactsOut, null>): SContactOut[] {
    return orderedValues(items);
}
