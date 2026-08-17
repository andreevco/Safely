/**
 * Shaped exactly like the addon that provides it: `open` is asynchronous because it reaches the
 * enclave, the rest are not. Failures throw with whatever the platform said; `Vault` decides what
 * that means.
 */
export interface HardwareKey {
    isAvailable(): boolean;
    ensureKey(tag: string): void;
    seal(tag: string, data: Buffer): Buffer;
    open(tag: string, blob: Buffer): Promise<Buffer>;
    destroy(tag: string): void;
}
