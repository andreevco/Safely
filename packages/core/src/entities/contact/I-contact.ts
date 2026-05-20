import type { ContactMeta } from './contact-meta';
import type { VM_TYPE } from '../blockchain';

export interface IContact {
    id: string;
    addresses: { blockchain: VM_TYPE; address: string }[];
    meta: ContactMeta;
    createdAt: Date;

    toJSON(): unknown;
}
