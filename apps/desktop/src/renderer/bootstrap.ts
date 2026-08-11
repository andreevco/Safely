import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { Buffer } from 'buffer';

import type { IsomorphicEventSource, SafelyCrypto } from '@safely/sync';
import { XHREventSource } from '@safely/xhr-event-source';

const pbkdf2Sha512: SafelyCrypto['pbkdf2Sha512'] = (password, salt, iterations, keyLength) =>
    pbkdf2Async(sha512, password, salt, { c: iterations, dkLen: keyLength });

globalThis.Buffer ??= Buffer as unknown as typeof globalThis.Buffer;

globalThis.safelyCrypto ??= { pbkdf2Sha512 };

/* The SSE stream sends an Authorization header, which the native `EventSource` cannot do. The XHR
   implementation shared with mobile needs `XMLHttpRequest` — present in every renderer and extension
   page, absent in a service worker and in node. */
(globalThis as { IsomorphicEventSource?: IsomorphicEventSource }).IsomorphicEventSource ??=
    XHREventSource as unknown as IsomorphicEventSource;
