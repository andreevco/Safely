import { app } from 'electron';
import os from 'node:os';

import type { AppInfo } from '../shared/app-info';

export function readAppInfo(): AppInfo {
    return {
        version: app.getVersion(),
        environment: app.isPackaged ? 'production' : 'development',
        deviceName: os.hostname(),
        osVersion: os.release(),
        locale: app.getLocale(),
        deviceCountryCode: app.getLocaleCountryCode() || null
    };
}
