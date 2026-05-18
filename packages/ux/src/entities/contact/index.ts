import type { ContactMeta, IContact } from '@safely/core';
import type { BLOCKCHAIN_NAME } from '@safely/core';
import { vmTypeByBlockchainName } from '@safely/core';
import { allowedContactMetaColors, Contact } from '@safely/core';

import { useTranslate } from '../../shared';
import { useAccountStore } from '../account';
import { useActiveAccount } from '../account/account-state';
import { useMutation } from '../query-core';
import { useToast } from '../toast';

export { contactKey } from './keys';

const EMPTY_CONTACTS: Contact[] = Object.freeze([]) as unknown as Contact[];

function pickRandomContactColor(): string {
    return allowedContactMetaColors[Math.floor(Math.random() * allowedContactMetaColors.length)];
}

export function useContacts(): Contact[] {
    return useAccountStore(s => s.active?.contacts ?? EMPTY_CONTACTS);
}

function useSetContacts() {
    const account = useActiveAccount();

    return useMutation<void, Error, Contact[]>({
        async mutationFn(contacts) {
            const sorted = [...contacts].sort((a, b) => a.meta.name.localeCompare(b.meta.name));
            await account.syncProvider.set(
                'contacts',
                sorted.map(c => c.toJSON())
            );
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
                addresses: addresses.map(a => ({
                    blockchain: vmTypeByBlockchainName(a.blockchain),
                    address: a.address
                })),
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
            const target = contacts.find(c => c.id === id);
            if (!target) {
                throw new Error(`Contact not found: ${String(id)}`);
            }

            let updated = target;
            if (meta) updated = updated.withMeta(meta);
            if (addresses)
                updated = updated.withAddresses(
                    addresses.map(a => ({
                        blockchain: vmTypeByBlockchainName(a.blockchain),
                        address: a.address
                    }))
                );

            await setContacts(contacts.map(c => (c.id === updated.id ? updated : c)));

            return updated;
        }
    });
}

export function useDeleteContact() {
    const { mutateAsync: setContacts } = useSetContacts();
    const toast = useToast();
    const t = useTranslate();
    const contacts = useContacts();

    return useMutation<void, Error, IContact>({
        async mutationFn(contact) {
            await setContacts(contacts.filter(c => c.id !== contact.id));
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
