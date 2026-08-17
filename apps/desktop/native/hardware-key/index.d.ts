/** Secure Enclave key operations. Every call throws on failure, with the OSStatus in the message. */
export declare function isAvailable(): boolean;
export declare function ensureKey(tag: string): void;
export declare function seal(tag: string, data: Buffer): Buffer;
/** The only asynchronous call: it reaches the enclave and runs off the main thread. */
export declare function open(tag: string, blob: Buffer): Promise<Buffer>;
export declare function destroy(tag: string): void;
