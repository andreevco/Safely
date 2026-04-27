import { sha256Prefix } from '@safely/core';

const HASH_BYTE_LENGTH = 8;
const HASH_HEX_LENGTH = HASH_BYTE_LENGTH * 2;

const FILE_SUFFIX = '.ndjson';
const MMKV_PREFIX = 'logger-buffer-';
const ACCOUNT_FILE_PREFIX = 'account-';

export const SYSTEM_FILENAME = `system${FILE_SUFFIX}`;
export const SYSTEM_MMKV_ID = `${MMKV_PREFIX}system`;

export function getAccountFilename(hash: string): string {
    return `${ACCOUNT_FILE_PREFIX}${hash}${FILE_SUFFIX}`;
}

export function getAccountMmkvId(hash: string): string {
    return `${MMKV_PREFIX}${hash}`;
}

export const ACCOUNT_FILE_PATTERN = new RegExp(
    `^${ACCOUNT_FILE_PREFIX}([a-f0-9]{${HASH_HEX_LENGTH}})${FILE_SUFFIX.replace('.', '\\.')}$`
);

export function accountLogHash(accountId: string): string {
    return sha256Prefix(accountId, HASH_BYTE_LENGTH);
}
