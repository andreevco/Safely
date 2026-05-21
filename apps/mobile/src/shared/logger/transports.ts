import type { Build } from '@safely/core';

import { FileTransport } from './file-transport';
import {
    accountLogHash,
    getAccountFilename,
    getAccountMmkvId,
    SYSTEM_FILENAME,
    SYSTEM_MMKV_ID
} from './naming';

export type TransportConfig = {
    appVersion: string;
    build: Build;
    deviceInfo: { name: string; osVersion: string };
};

export function createSystemTransport(config: TransportConfig): FileTransport {
    return new FileTransport({
        filename: SYSTEM_FILENAME,
        mmkvId: SYSTEM_MMKV_ID,
        appVersion: config.appVersion,
        build: config.build,
        deviceInfo: config.deviceInfo
    });
}

export function createAccountTransport(config: TransportConfig, accountId: string): FileTransport {
    const hash = accountLogHash(accountId);

    return new FileTransport({
        filename: getAccountFilename(hash),
        mmkvId: getAccountMmkvId(hash),
        appVersion: config.appVersion,
        build: config.build,
        deviceInfo: config.deviceInfo
    });
}
