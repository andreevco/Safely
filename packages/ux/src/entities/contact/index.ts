import type { ContactMeta, IContact } from '@safely/core';
import type { BLOCKCHAIN_NAME } from '@safely/core';
import { vmTypeByBlockchainName } from '@safely/core';
import { allowedContactMetaColors, Contact } from '@safely/core';
import type { SContact } from '@safely/sync-storage';
import { sContactAddress } from '@safely/sync-storage';

import { useTranslate } from '../../shared';
import { useActiveAccountSyncStorageUpdate, useActiveAccountStoreSlot } from '../account';
import { useMutation } from '../query-core';
import { useToast } from '../toast';

export { contactKey } from './keys';

const EMPTY_CONTACTS: Contact[] = Object.freeze([]) as unknown as Contact[];

function pickRandomContactColor(): string {
    return allowedContactMetaColors[Math.floor(Math.random() * allowedContactMetaColors.length)];
}

export function useContacts(): Contact[] {
    return useActiveAccountStoreSlot('contacts') ?? EMPTY_CONTACTS;
}

export function useCreateContact() {
    const update = useActiveAccountSyncStorageUpdate('contacts');

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
            update(draft => draft.push(contact.toJSON()));

            return contact;
        }
    });
}

export function useEditContact() {
    const update = useActiveAccountSyncStorageUpdate('contacts');
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
            if (!addresses && !meta) {
                throw new Error('No changes provided');
            }

            return new Promise(resolve => {
                update(draft => {
                    draft.update(target.jsonArrayId(), sContactDraft => {
                        if (meta) {
                            sContactDraft.set('meta', { ...sContactDraft.get().meta, ...meta });
                        }
                        if (addresses) {
                            sContactDraft.set(
                                'addresses',
                                addresses.map(({ address }) => sContactAddress.toJson({ address }))
                            );
                        }

                        resolve(Contact.restoreContact(sContactDraft.get() as SContact));
                    });
                });
            });
        }
    });
}

export function useDeleteContact() {
    const update = useActiveAccountSyncStorageUpdate('contacts');
    const toast = useToast();
    const t = useTranslate();

    return useMutation<void, Error, Contact>({
        async mutationFn(contact) {
            update(draft => draft.remove(contact.jsonArrayId()));
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
