import { sha256 } from '@noble/hashes/sha2.js';

import { HTTPMethod } from './generated';
import { IIkService } from '../crypto/service/ik-service';
import { toHex, u16be, u32be, u64be, utf8 } from '../utils/buffer';

export class ApiSigner {
    constructor(private readonly ikService: IIkService) {}

    /**
     * Returns Authorization header value for the given request parameters.
     * @param method
     * @param path_with_query
     * @param body
     */
    public async sign(method: HTTPMethod, path_with_query: string, body: string): Promise<string> {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.getNonce();
        console.log(path_with_query);

        const toSign = Buffer.concat([
            utf8('safely/sync/v1/http-auth'),
            Buffer.from([0x00]),
            u16be(method.length),
            utf8(method),
            u16be(path_with_query.length),
            utf8(path_with_query),
            sha256(utf8(body)),
            u64be(timestamp),
            u32be(nonce)
        ]);

        console.log(toSign.toString('hex'));

        const signature = await this.ikService.sign(toSign);

        const pub = await this.ikService.getPub();

        return `ED25519 pub=${toHex(pub)},nonce=${nonce},timestamp=${timestamp},sig=${toHex(signature)}`;
    }

    private getNonce(): number {
        return Math.floor(Math.random() * 0xffffffff);
    }
}
