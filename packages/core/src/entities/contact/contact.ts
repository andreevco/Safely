import { v7 as uuid7 } from 'uuid';

import { type SContact, sContact, sContactAddress } from '@safely/sync-storage';

import type { ContactMeta } from './contact-meta';
import type { IContact } from './I-contact';
import { VM_TYPE } from '../blockchain';

export class Contact implements IContact {
    public static restoreContact(contact: SContact): Contact {
        return new Contact({
            id: contact.id,
            addresses: contact.addresses.map(item => ({
                address: item.address,
                blockchain: VM_TYPE.BTC
            })),
            meta: contact.meta,
            createdAt: new Date(contact.createdAt)
        });
    }

    public readonly id: string;
    public readonly addresses: { blockchain: VM_TYPE; address: string }[];
    public readonly meta: ContactMeta;
    public readonly createdAt: Date;

    constructor(params: {
        id?: string;
        addresses: { blockchain: VM_TYPE; address: string }[];
        meta: ContactMeta;
        createdAt?: Date;
    }) {
        this.id = params.id ?? this.generateId();
        this.addresses = params.addresses;
        this.meta = params.meta;
        this.createdAt = params.createdAt ?? new Date();
    }

    public withMeta(meta: Partial<ContactMeta>): Contact {
        return new Contact({
            id: this.id,
            addresses: this.addresses,
            meta: { ...this.meta, ...meta },
            createdAt: this.createdAt
        });
    }

    public withAddresses(addresses: { blockchain: VM_TYPE; address: string }[]): Contact {
        return new Contact({
            id: this.id,
            addresses,
            meta: this.meta,
            createdAt: this.createdAt
        });
    }

    private generateId() {
        return uuid7();
    }

    public toJSON(): SContact {
        return sContact.toJson({
            id: this.id,
            addresses: this.addresses.map(item =>
                sContactAddress.toJson({ address: item.address })
            ),
            meta: this.meta,
            createdAt: this.createdAt.getTime()
        });
    }
}
