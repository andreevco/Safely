import { v7 as uuid7 } from 'uuid';

import { type SContact, ArraySchemaIdKey } from '@safely/sync-storage';

import type { ContactMeta } from './contact-meta';
import type { IContact } from './I-contact';
import { VM_TYPE } from '../blockchain';

export class Contact implements IContact {
    public static restoreContact(sContact: SContact): Contact {
        return new Contact({
            id: sContact.id,
            addresses: sContact.addresses.map(item => ({
                address: item.address,
                blockchain: VM_TYPE.BTC
            })),
            meta: sContact.meta,
            createdAt: new Date(sContact.createdAt)
        });
    }

    public readonly id: string;
    public addresses: { blockchain: VM_TYPE; address: string }[];
    public meta: ContactMeta;
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

    public updateMeta(meta: Partial<ContactMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public setAddresses(addresses: { blockchain: VM_TYPE; address: string }[]): void {
        this.addresses = addresses;
    }

    private generateId() {
        return uuid7();
    }

    public toJSON(): SContact {
        return {
            id: this.id,
            addresses: this.addresses.map(item => ({
                address: item.address,
                [ArraySchemaIdKey]: item.address
            })),
            meta: this.meta,
            createdAt: this.createdAt.getTime(),
            [ArraySchemaIdKey]: this.id
        };
    }
}
