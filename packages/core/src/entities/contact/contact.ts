import { ContactId } from './contact-id';
import { ContactMeta } from './contact-meta';
import { SContactIn, SContactOut } from './contact.stored';
import { IContact } from './I-contact';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export class Contact implements IContact {
    public static restoreContact(sContact: SContactOut): Contact {
        return new Contact({
            id: sContact.id,
            addresses: sContact.addresses,
            meta: sContact.meta,
            createdAt: new Date(sContact.createdAt)
        });
    }

    public readonly id: ContactId;
    public addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[];
    public meta: ContactMeta;
    public readonly createdAt: Date;

    constructor(params: {
        id?: ContactId;
        addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[];
        meta: ContactMeta;
        createdAt?: Date;
    }) {
        this.id = params.id ?? ContactId.create();
        this.addresses = params.addresses;
        this.meta = params.meta;
        this.createdAt = params.createdAt ?? new Date();
    }

    public updateMeta(meta: Partial<ContactMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public setAddresses(addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[]): void {
        this.addresses = addresses;
    }

    public toJSON(): SContactIn {
        return {
            id: this.id.toJSON(),
            addresses: this.addresses,
            meta: this.meta,
            createdAt: this.createdAt.getTime()
        };
    }
}
