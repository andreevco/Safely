import { Contact } from './contact';
import { ContactId } from './contact-id';
import { ContactMeta } from './contact-meta';
import type { SContactOut } from './contact.stored';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export class ContactFactory {
    public static restoreContact(sContact: SContactOut): Contact {
        return Contact.restoreContact(sContact);
    }

    public static createContact(params: {
        blockchain: BLOCKCHAIN_NAME;
        address: string;
        meta: ContactMeta;
    }): Contact {
        return new Contact({
            id: ContactId.create(),
            blockchain: params.blockchain,
            address: params.address,
            meta: params.meta,
            createdAt: new Date()
        });
    }
}
