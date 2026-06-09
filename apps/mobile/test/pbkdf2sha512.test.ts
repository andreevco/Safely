import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// BIP39 PBKDF2 self-check vector (Trezor #1, empty passphrase) — must stay in
// sync with the SELF_CHECK constant in safely-crypto/pbkdf2sha512.ts.
const SELF_CHECK_DERIVED_KEY_HEX =
    '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';
const correctDerivedKey = () => new Uint8Array(Buffer.from(SELF_CHECK_DERIVED_KEY_HEX, 'hex'));

// Mocks for the two real implementations the module chooses between.
const nativePbkdf2Sha512 =
    vi.fn<
        (
            password: Uint8Array,
            salt: Uint8Array,
            iterations: number,
            keyLength: number
        ) => Uint8Array
    >();
const noblePbkdf2Async =
    vi.fn<
        (
            hash: unknown,
            password: Uint8Array,
            salt: Uint8Array,
            opts: { c: number; dkLen: number }
        ) => Promise<Uint8Array>
    >();
const loggerError = vi.fn();

vi.mock('../modules/safely-crypto/src', () => ({ pbkdf2Sha512: nativePbkdf2Sha512 }));
vi.mock('@noble/hashes/pbkdf2.js', () => ({ pbkdf2Async: noblePbkdf2Async }));
vi.mock('@noble/hashes/sha2.js', () => ({ sha512: { __sha512: true } }));
vi.mock('@mobile/shared/logger', () => ({ logger: { error: loggerError } }));

// The provider is selected at module-evaluation time, so each scenario must
// re-import the module fresh after arranging the native mock's behaviour.
const importModule = async () => {
    vi.resetModules();
    return import('../safely-crypto/pbkdf2sha512');
};

beforeEach(() => {
    nativePbkdf2Sha512.mockReset();
    noblePbkdf2Async.mockReset();
    loggerError.mockReset();
    noblePbkdf2Async.mockImplementation(() => Promise.resolve(new Uint8Array([1, 2, 3])));
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('pbkdf2Sha512 provider selection', () => {
    it('runs the self-check against the BIP39 vector (mnemonic/2048/64) on the native impl', async () => {
        nativePbkdf2Sha512.mockReturnValue(correctDerivedKey());

        await importModule();

        expect(nativePbkdf2Sha512).toHaveBeenCalledTimes(1);
        const [password, salt, iterations, keyLength] = nativePbkdf2Sha512.mock.calls[0];
        expect(Buffer.from(password).toString('utf8')).toBe(
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
        );
        expect(Buffer.from(salt).toString('utf8')).toBe('mnemonic');
        expect(iterations).toBe(2048);
        expect(keyLength).toBe(64);
    });

    it('uses the native impl when its self-check derives the expected key', async () => {
        nativePbkdf2Sha512.mockReturnValue(correctDerivedKey());

        const { pbkdf2Sha512 } = await importModule();
        nativePbkdf2Sha512.mockClear();
        const nativeResult = new Uint8Array([9, 9, 9]);
        nativePbkdf2Sha512.mockReturnValue(nativeResult);

        const result = await pbkdf2Sha512(new Uint8Array([0]), new Uint8Array([0]), 1, 3);

        expect(nativePbkdf2Sha512).toHaveBeenCalledTimes(1);
        expect(noblePbkdf2Async).not.toHaveBeenCalled();
        expect(result).toBe(nativeResult);
    });

    it('falls back to noble when the native self-check derives a wrong key', async () => {
        nativePbkdf2Sha512.mockReturnValue(new Uint8Array(64)); // all zeros — wrong vector

        const { pbkdf2Sha512 } = await importModule();
        nativePbkdf2Sha512.mockClear();

        const password = new Uint8Array([1]);
        const salt = new Uint8Array([2]);
        await pbkdf2Sha512(password, salt, 4096, 32);

        expect(nativePbkdf2Sha512).not.toHaveBeenCalled();
        expect(noblePbkdf2Async).toHaveBeenCalledTimes(1);
        // noble fallback wires args as pbkdf2Async(sha512, password, salt, { c, dkLen }).
        const [hash, pwd, slt, opts] = noblePbkdf2Async.mock.calls[0];
        expect(hash).toEqual({ __sha512: true });
        expect(pwd).toBe(password);
        expect(slt).toBe(salt);
        expect(opts).toEqual({ c: 4096, dkLen: 32 });
    });

    it('falls back to noble and logs when the native self-check throws', async () => {
        nativePbkdf2Sha512.mockImplementation(() => {
            throw new Error('native module unavailable');
        });

        const { pbkdf2Sha512 } = await importModule();
        expect(loggerError).toHaveBeenCalledWith(
            '[pbkdf2] native self-check threw',
            expect.any(Error)
        );

        nativePbkdf2Sha512.mockReset();
        await pbkdf2Sha512(new Uint8Array([1]), new Uint8Array([2]), 1, 1);

        expect(nativePbkdf2Sha512).not.toHaveBeenCalled();
        expect(noblePbkdf2Async).toHaveBeenCalledTimes(1);
    });

    it('falls back to noble when the native impl returns a wrong-length key', async () => {
        nativePbkdf2Sha512.mockReturnValue(new Uint8Array([1, 2, 3])); // length 3, not 64

        const { pbkdf2Sha512 } = await importModule();
        nativePbkdf2Sha512.mockClear();
        await pbkdf2Sha512(new Uint8Array([1]), new Uint8Array([2]), 1, 1);

        expect(noblePbkdf2Async).toHaveBeenCalledTimes(1);
        expect(nativePbkdf2Sha512).not.toHaveBeenCalled();
    });

    it('returns a promise from the native path (sync impl wrapped)', async () => {
        nativePbkdf2Sha512.mockReturnValue(correctDerivedKey());

        const { pbkdf2Sha512 } = await importModule();
        const pending = pbkdf2Sha512(new Uint8Array([0]), new Uint8Array([0]), 1, 3);

        expect(pending).toBeInstanceOf(Promise);
        await pending;
    });
});
