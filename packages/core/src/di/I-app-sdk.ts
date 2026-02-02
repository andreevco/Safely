import { ISecretEncryptor } from './I-secret-encryptor';
import { QrScanner } from './qr-scanner';
import { Security } from './security';
import { NumberFormatLocale } from '../utils';

export interface IAppSdk {
    secretEncryptor: ISecretEncryptor;

    qrScanner: QrScanner;

    security: Security;

    numberFormatLocale: NumberFormatLocale;
}
