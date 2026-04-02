/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */
// noinspection SuspiciousTypeOfGuard

import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';

import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/ru';

import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en';
import '@formatjs/intl-numberformat/locale-data/ru';
import * as Crypto from 'expo-crypto';

import { XHREventSource } from '@safely/sync';

/**
 *  Explicit resources management polyfills
 */

if (typeof Symbol.dispose !== 'symbol') {
    (Symbol as any).dispose = Symbol.for('Symbol.dispose');
}
if (typeof Symbol.asyncDispose !== 'symbol') {
    (Symbol as any).asyncDispose = Symbol.for('Symbol.asyncDispose');
}
if (typeof global.SuppressedError === 'undefined') {
    class SuppressedError extends Error {
        public error: unknown;
        public suppressed: unknown;
        constructor(error: unknown, suppressed: unknown, message?: string) {
            super(message ?? 'SuppressedError');
            this.name = 'SuppressedError';
            this.error = error;
            this.suppressed = suppressed;
        }
    }

    (global as any).SuppressedError = SuppressedError;
}

/**
 *  Buffer polyfill
 */

global.Buffer = require('@craftzdog/react-native-buffer').Buffer;

/**
 *  EventSource polyfill
 */

(global as any).IsomorphicEventSource = XHREventSource;

/**
 * crypto polyfills
 */
(global.crypto as any) = {
    ...Crypto,
    randomBytes: Crypto.getRandomBytes
};
