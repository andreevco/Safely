import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { formatBytesAsUuid } from '../utils/uuid';

const ANALYTICS_ACCOUNT_UUID_INFO = utf8ToBytes('safely/analytics/v1/account-uuid');

export function deriveAnalyticsAccountUuid(masterKey: Uint8Array): string {
    const bytes = hkdf(sha256, masterKey, undefined, ANALYTICS_ACCOUNT_UUID_INFO, 16);

    return formatBytesAsUuid(bytes, 5);
}
