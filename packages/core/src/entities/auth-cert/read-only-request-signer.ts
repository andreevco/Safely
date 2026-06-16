import { signRequest } from './sign';
import { utf8 } from './utils';
import type { RequestSigner } from '../../utils/fetch';

export interface ReadOnlyCredential {
    certHex: string;
    reqSecretKey: Uint8Array;
}

export class ReadOnlyRequestSigner implements RequestSigner {
    #credential?: Promise<ReadOnlyCredential>;

    constructor(private readonly credentialProvider: () => Promise<ReadOnlyCredential>) {}

    public async sign(method: string, pathWithQuery: string, body: string): Promise<string> {
        const { certHex, reqSecretKey } = await this.resolve();
        return signRequest({
            certHex,
            reqSecretKey,
            method,
            pathWithQuery,
            bodyBytes: utf8(body)
        });
    }

    private resolve(): Promise<ReadOnlyCredential> {
        if (!this.#credential) {
            this.#credential = this.credentialProvider().catch(err => {
                this.#credential = undefined;
                throw err;
            });
        }
        return this.#credential;
    }
}
