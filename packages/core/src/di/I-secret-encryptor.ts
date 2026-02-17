import z from 'zod';

export const sSecretEncrypted = z.string();
export type SSecretEncrypted = z.infer<typeof sSecretEncrypted>;

export const sSecretDecrypted = z.string();
export type SSecretDecrypted = z.infer<typeof sSecretDecrypted>;

export interface ISecretEncryptor {
    /**
     * Search for the decrypted value in the keychain cache;
     * Decrypts secret with secret key stored in the keychain in cached value is not found and save it in the keychain
     */
    decryptSecret(encryptedSecret: SSecretEncrypted): Promise<SSecretDecrypted>;

    encryptSecret(decryptedSecret: SSecretDecrypted): Promise<SSecretEncrypted>;

    removeSecretCache(encryptedSecret: SSecretEncrypted): Promise<void>;
}
