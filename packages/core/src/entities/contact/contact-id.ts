import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';

import { Id } from '../../utils/id';

export class ContactId extends Id {
    public static create(): ContactId {
        return new ContactId(bytesToHex(randomBytes(16)));
    }

    constructor(public readonly hash: string) {
        super();
    }

    public toString(): string {
        return this.of('contact', this.hash);
    }

    public toJSON(): { hash: string } {
        return { hash: this.hash };
    }
}
