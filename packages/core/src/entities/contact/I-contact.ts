import { ContactId } from './contact-id';
import { ContactMeta } from './contact-meta';
import { BLOCKCHAIN_NAME } from '../blockchain/blockchain-name';

export interface IContact {
    id: ContactId;
    addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[];
    meta: ContactMeta;
    createdAt: Date;

    updateMeta(meta: Partial<ContactMeta>): void;
    setAddresses(addresses: { blockchain: BLOCKCHAIN_NAME; address: string }[]): void;
    toJSON(): unknown;
}
