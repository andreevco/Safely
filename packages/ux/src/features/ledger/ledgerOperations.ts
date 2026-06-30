import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { OpenAppDeviceAction } from '@ledgerhq/device-management-kit';

import { awaitDeviceAction } from '@safely/core';

const BITCOIN_APP_NAME = 'Bitcoin';

export const connectLedger = (
    ledgerKit: DeviceManagementKit,
    device: DiscoveredDevice
): Promise<string> =>
    ledgerKit.connect({ device, sessionRefresherOptions: { isRefresherDisabled: true } });

export const openBitcoinApp = (
    ledgerKit: DeviceManagementKit,
    sessionId: string,
    signal?: AbortSignal
): Promise<void> =>
    awaitDeviceAction(
        ledgerKit.executeDeviceAction({
            sessionId,
            deviceAction: new OpenAppDeviceAction({ input: { appName: BITCOIN_APP_NAME } })
        }),
        signal
    );
