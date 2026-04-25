import { sha256Prefix } from '@safely/core';

const HASH_BYTE_LENGTH = 8;

export function accountLogHash(accountId: string): string {
    return sha256Prefix(accountId, HASH_BYTE_LENGTH);
}

export const ACCOUNT_LOG_HASH_HEX_LENGTH = HASH_BYTE_LENGTH * 2;
