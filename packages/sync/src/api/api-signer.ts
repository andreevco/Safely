import { sha256 } from '@noble/hashes/sha2.js';

import type { HTTPMethod, RequestSigner } from './request-signer';
import type { IIkService } from '../crypto/service/ik-service';
import { toHex, u16be, u32be, u64be, utf8 } from '../utils/buffer';

export class ApiSigner implements RequestSigner {
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

        const signature = await this.ikService.sign(toSign);

        const pub = await this.ikService.getPub();

        return `ED25519 pub=${toHex(pub)},nonce=${nonce},timestamp=${timestamp},sig=${toHex(signature)}`;
    }

    private getNonce(): number {
        const arr = new Uint8Array(4);
        crypto.getRandomValues(arr);
        return Buffer.from(arr).readUint32BE();
    }
}
