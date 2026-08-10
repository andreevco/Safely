import { Buffer } from 'buffer';

import type { IsomorphicEventSource, SafelyCrypto } from '@safely/sync';
import { XHREventSource } from '@safely/xhr-event-source';

/** WebCrypto rejects views over a `SharedArrayBuffer`; the inputs are small enough to copy. */
const toPlainBytes = (bytes: Uint8Array): Uint8Array<ArrayBuffer> => {
    const plain = new Uint8Array(bytes.byteLength);
    plain.set(bytes);

    return plain;
};

/** `crypto.subtle` needs a secure context — hence the `app://` scheme in production. */
const pbkdf2Sha512: SafelyCrypto['pbkdf2Sha512'] = async (
    password,
    salt,
    iterations,
    keyLength
) => {
    const key = await crypto.subtle.importKey('raw', toPlainBytes(password), 'PBKDF2', false, [
        'deriveBits'
    ]);

    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-512', salt: toPlainBytes(salt), iterations },
        key,
        keyLength * 8
    );

    return new Uint8Array(bits);
};

/** The globals the domain packages expect from their host, as `global-polyfills.ts` does on mobile. */
export function installWebGlobals(): void {
    globalThis.Buffer ??= Buffer as unknown as typeof globalThis.Buffer;

    globalThis.safelyCrypto ??= { pbkdf2Sha512 };

    /* The SSE stream sends an Authorization header, which the native `EventSource` cannot do.
       The XHR implementation shared with mobile needs `XMLHttpRequest` — present in every
       renderer and extension page, absent in a service worker and in node. */
    (globalThis as { IsomorphicEventSource?: IsomorphicEventSource }).IsomorphicEventSource ??=
        XHREventSource as unknown as IsomorphicEventSource;
}
