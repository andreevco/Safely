/** Generic-password items in the macOS data protection keychain. Every call throws on failure,
 *  with the OSStatus in the message. */
export declare function isAvailable(): boolean;
export declare function get(service: string, account: string): Promise<Buffer | null>;
export declare function set(service: string, account: string, value: string): Promise<void>;
export declare function remove(service: string, account: string): Promise<void>;
export declare function keys(service: string): Promise<string[]>;
/** Every item of the service in one attribute match, not one delete per account. */
export declare function clear(service: string): Promise<void>;
