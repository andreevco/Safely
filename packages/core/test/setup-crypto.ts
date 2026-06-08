import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';

// The test harness is an "app": it installs its own `safelyCrypto` provider
// (pure-JS noble) so domain tests that derive seeds have a working primitive.
globalThis.safelyCrypto = {
    pbkdf2Sha512: (password, salt, iterations, keyLength) =>
        pbkdf2Async(sha512, password, salt, { c: iterations, dkLen: keyLength })
};
