import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    allowedContactMetaColors,
    BLOCKCHAIN_NAME,
    Contact,
    ContactFactory,
    ContactMeta,
    IContact
} from '@safely/core';

import { useActiveAccountSyncedStorage, useSuspenseQuery, useTranslate } from '../../shared';
import { useActiveAccountQueryKey } from '../account';
import { useToast } from '../toast';

export { contactKey } from './keys';

function pickRandomContactColor(): string {
    return allowedContactMetaColors[Math.floor(Math.random() * allowedContactMetaColors.length)];
}

export function useContactsQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('contacts');

    return useSuspenseQuery({
        queryKey: accountQueryKey.contacts.toKey(),
        queryFn: () => (get() ?? []).map(c => ContactFactory.restoreContact(c)),
        staleTime: Infinity
    });
}

export function useContacts(): Contact[] {
    return useContactsQuery().data;
}

function useSetContacts() {
    const { set } = useActiveAccountSyncedStorage('contacts');
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    return useMutation<void, Error, Contact[]>({
        async mutationFn(contacts) {
            await set(contacts.map(c => c.toJSON()));
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
        { name: string; address: string; blockchain: BLOCKCHAIN_NAME }
    >({
        async mutationFn({ name, address, blockchain }) {
            const contact = ContactFactory.createContact({
                blockchain,
                address,
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
            address?: string;
            blockchain?: BLOCKCHAIN_NAME;
        }
    >({
        async mutationFn({ contact: { id }, meta, address, blockchain }) {
            const target = contacts.find(c => c.id.isEq(id));
            if (!target) {
                throw new Error(`Contact not found: ${id.toString()}`);
            }

            if (meta) target.updateMeta(meta);
            if (address !== undefined && blockchain !== undefined) {
                target.updateAddress(blockchain, address);
            }

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
    return contacts.find(c => c.address === address)?.meta;
}
