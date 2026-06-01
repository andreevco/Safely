export {
    type SSecretDecrypted,
    type SSecretEncrypted,
    sSecretDecrypted,
    sSecretEncrypted
} from '@safely/sync';

import type { SSecretDecrypted, SSecretEncrypted } from '@safely/sync';

export interface ISecretEncryptor {
    encrypt(decryptedSecret: SSecretDecrypted): Promise<SSecretEncrypted>;
    decrypt(encryptedSecret: SSecretEncrypted): Promise<SSecretDecrypted>;
}
