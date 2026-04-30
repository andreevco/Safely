import { useQueryClient } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
    allowedContactMetaColors,
    BLOCKCHAIN_NAME,
    Contact,
    ContactMeta,
    IContact
} from '@safely/core';

import { useTranslate } from '../../shared';
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

            return data.map(c => Contact.restoreContact(c));
        },
        staleTime: Infinity
    });
}

export function useContacts() {
    return useContactsQuery().data;
}

function useSetContacts() {
    const { set } = useActiveAccountSyncedStorage('contacts');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Contact[]>({
        async mutationFn(contacts) {
            const sorted = [...contacts].sort((a, b) => a.meta.name.localeCompare(b.meta.name));
            await set(sorted.map(c => c.toJSON()));
            await client.invalidateQueries({ queryKey: accountQueryKey.contacts.toKey() });
        }
    });
}

export function useCreateContact() {
    const { mutateAsync: setContacts } = useSetContacts();
    const contacts = useContacts();

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

            await setContacts(contacts.concat(contact));

            return contact;
        }
    });
}

export function useEditContact() {
    const { mutateAsync: setContacts } = useSetContacts();
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

            if (meta) target.updateMeta(meta);
            if (addresses) target.setAddresses(addresses);

            await setContacts(contacts);

            return target;
        }
    });
}

export function useDeleteContact() {
    const { mutateAsync: setContacts } = useSetContacts();
    const contacts = useContacts();
    const toast = useToast();
    const t = useTranslate();

    return useMutation<void, Error, IContact>({
        async mutationFn(contact) {
            await setContacts(contacts.filter(c => !c.id.isEq(contact.id)));
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
