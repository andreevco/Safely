import { ContactId } from './contact-id';
import { ContactMeta } from './contact-meta';
import { SContactIn, SContactOut } from './contact.stored';
import { IContact } from './I-contact';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export class Contact implements IContact {
    public static restoreContact(sContact: SContactOut): Contact {
        return new Contact({
            id: sContact.id,
            blockchain: sContact.blockchain,
            address: sContact.address,
            meta: sContact.meta,
            createdAt: new Date(sContact.createdAt)
        });
    }

    public readonly id: ContactId;
    public blockchain: BLOCKCHAIN_NAME;
    public address: string;
    public meta: ContactMeta;
    public readonly createdAt: Date;

    constructor(params: {
        id: ContactId;
        blockchain: BLOCKCHAIN_NAME;
        address: string;
        meta: ContactMeta;
        createdAt: Date;
    }) {
        this.id = params.id;
        this.blockchain = params.blockchain;
        this.address = params.address;
        this.meta = params.meta;
        this.createdAt = params.createdAt;
    }

    public updateMeta(meta: Partial<ContactMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public updateAddress(blockchain: BLOCKCHAIN_NAME, address: string): void {
        this.blockchain = blockchain;
        this.address = address;
    }

    public toJSON(): SContactIn {
        return {
            id: this.id.toJSON(),
            blockchain: this.blockchain,
            address: this.address,
            meta: this.meta,
            createdAt: this.createdAt.getTime()
        };
    }
}
