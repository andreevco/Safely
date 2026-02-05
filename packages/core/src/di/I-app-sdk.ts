import { ISecretEncryptor } from './I-secret-encryptor';
import { ITreeStorage } from './I-storage';
import { QrScanner } from './qr-scanner';
import { Security } from './security';

export interface IAppSdk {
    storage: ITreeStorage;

    secretEncryptor: ISecretEncryptor;

    qrScanner: QrScanner;

    security: Security;
}
