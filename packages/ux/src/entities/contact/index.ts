import { useQueryClient } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
    allowedContactMetaColors,
    BLOCKCHAIN_NAME,
    Contact,
    ContactMeta,
    IContact
} from '@safely/core';
import { orderedIds, toOrderedSet } from '@safely/slottree';

import { useTranslate } from '../../shared';
import { contactsFromOrderedSet } from '../../shared/storage/account/synced/schemas/contacts.schema';
import { useActiveAccountQueryKey } from '../account';
import { useActiveAccountSyncedStorage } from '../account/storage';
import { useMutation } from '../query-core';
import { useToast } from '../toast';

export { contactKey } from './keys';

function pickRandomContactColor(): string {
    return allowedContactMetaColors[Math.floor(Math.random() * allowedContactMetaColors.length)];
}

function useContactsQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('contacts');

    return useSuspenseQuery({
        queryKey: accountQueryKey.contacts.toKey(),
        async queryFn() {
            const data = get();
            if (data === null) {
                return [];
            }

            return contactsFromOrderedSet(data).map(c => Contact.restoreContact(c));
        },
        staleTime: Infinity
    });
}

export function useContacts() {
    return useContactsQuery().data;
}

type MutableOrderedSet<T> = {
    setById: Record<string, T>;
    setOrder: Record<string, number>;
};

function createEmptyOrderedSet<T>(): MutableOrderedSet<T> {
    return { setById: {}, setOrder: {} };
}

function rewriteOrder<T>(set: MutableOrderedSet<T>, ids: string[]) {
    const nextIds = new Set(ids);
    for (const id of Object.keys(set.setOrder)) {
        if (!nextIds.has(id)) {
            delete set.setOrder[id];
        }
    }

    ids.forEach((id, index) => {
        set.setOrder[id] = index;
    });
}

function sortContactsByName<T extends { meta: ContactMeta }>(contacts: MutableOrderedSet<T>) {
    rewriteOrder(
        contacts,
        Object.keys(contacts.setById).sort((left, right) =>
            contacts.setById[left].meta.name.localeCompare(contacts.setById[right].meta.name)
        )
    );
}

export function useCreateContact() {
    const { update } = useActiveAccountSyncedStorage('contacts');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<
        Contact,
        Error,
        { name: string; addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[] }
    >({
        async mutationFn({ name, addresses }) {
            const contact = new Contact({
                addresses,
                meta: { name, color: pickRandomContactColor() }
            });

            const contactJson = contact.toJSON();
            const contactId = contact.id.toString();

            await update(draft => {
                if (!draft.contacts) {
                    const contacts = createEmptyOrderedSet<typeof contactJson>();
                    contacts.setById[contactId] = contactJson;
                    sortContactsByName(contacts);
                    (draft as { contacts: unknown }).contacts = contacts;
                    return;
                }

                const contacts = draft.contacts as MutableOrderedSet<typeof contactJson>;
                contacts.setById[contactId] = contactJson;
                sortContactsByName(contacts);
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.contacts.toKey() });

            return contact;
        }
    });
}

export function useEditContact() {
    const { update } = useActiveAccountSyncedStorage('contacts');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();
    const contacts = useContacts();

    return useMutation<
        Contact,
        Error,
        {
            contact: IContact;
            meta?: Partial<ContactMeta>;
            addresses?: { blockchain: BLOCKCHAIN_NAME; address: string }[];
        }
    >({
        async mutationFn({ contact: { id }, meta, addresses }) {
            const target = contacts.find(c => c.id.isEq(id));
            if (!target) {
                throw new Error(`Contact not found: ${id.toString()}`);
            }

            const contactId = id.toString();
            const nextMeta = meta ? { ...target.meta, ...meta } : target.meta;
            const nextAddresses = addresses ?? target.addresses;

            await update(draft => {
                const stored = draft.contacts?.setById[contactId];
                if (!stored) {
                    throw new Error(`Contact not found: ${id.toString()}`);
                }

                stored.meta = nextMeta;
                stored.addresses = toOrderedSet(nextAddresses, item => item.address);
                if (meta && 'name' in meta) {
                    sortContactsByName(draft.contacts as MutableOrderedSet<typeof stored>);
                }
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.contacts.toKey() });

            if (meta) target.updateMeta(meta);
            if (addresses) target.setAddresses(addresses);

            return target;
        }
    });
}

export function useDeleteContact() {
    const { update } = useActiveAccountSyncedStorage('contacts');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();
    const toast = useToast();
    const t = useTranslate();

    return useMutation<void, Error, IContact>({
        async mutationFn(contact) {
            const contactId = contact.id.toString();

            await update(draft => {
                if (!draft.contacts) {
                    return;
                }

                const contacts = draft.contacts as MutableOrderedSet<unknown>;
                delete contacts.setById[contactId];
                delete contacts.setOrder[contactId];
                rewriteOrder(contacts, orderedIds(contacts));
            });
            await client.invalidateQueries({ queryKey: accountQueryKey.contacts.toKey() });
        },
        onSuccess() {
            toast({ message: t('common.removed') });
        }
    });
}

export function findContactMetaByAddress(
    contacts: Contact[],
    address: string
): ContactMeta | undefined {
    return contacts.find(c => c.addresses.some(a => a.address === address))?.meta;
}
