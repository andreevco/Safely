import { OpenAppDeviceAction } from '@ledgerhq/device-management-kit';
import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { rnBleTransportIdentifier } from '@ledgerhq/device-transport-kit-react-native-ble';
import { firstValueFrom } from 'rxjs';
import type { AnyEventObject } from 'xstate';
import { fromCallback, fromPromise } from 'xstate';

import type { LedgerSession } from '@safely/core';
import { awaitDeviceAction, getLedgerMasterFingerprint } from '@safely/core';

const BITCOIN_APP_NAME = 'Bitcoin';

const MIN_BITCOIN_APP_MAJOR = 2;
const MIN_BITCOIN_APP_MINOR = 1;

const isBitcoinAppSupported = (version: string | undefined): boolean => {
    if (!version) {
        return true;
    }

    const [major, minor] = version.split('.').map(Number);

    return (
        major > MIN_BITCOIN_APP_MAJOR ||
        (major === MIN_BITCOIN_APP_MAJOR && minor >= MIN_BITCOIN_APP_MINOR)
    );
};

export type CheckLedgerAppVersionInput = {
    dmk: DeviceManagementKit;
    sessionId: string;
};

export const checkLedgerAppVersion = fromPromise<boolean, CheckLedgerAppVersionInput>(
    async ({ input }) => {
        const state = await firstValueFrom(
            input.dmk.getDeviceSessionState({ sessionId: input.sessionId })
        );

        const version = 'currentApp' in state ? state.currentApp.version : undefined;

        return isBitcoinAppSupported(version);
    }
);

export const scanLedgerDevices = fromCallback<AnyEventObject, { dmk: DeviceManagementKit }>(
    ({ sendBack, input }) => {
        const subscription = input.dmk
            .listenToAvailableDevices({ transport: rnBleTransportIdentifier })
            .subscribe({
                next: devices => sendBack({ type: 'DEVICES_FOUND', devices }),
                error: () => {
                    // TODO Think again what to do, log? timeout? Too much noise from here
                }
            });

        return () => subscription.unsubscribe();
    }
);

export type ConnectLedgerSessionInput = {
    dmk: DeviceManagementKit;
    device: DiscoveredDevice;
};

export const connectLedgerSession = fromPromise<string, ConnectLedgerSessionInput>(
    async ({ input, signal }) => {
        const sessionId = await input.dmk.connect({ device: input.device });

        if (signal.aborted) {
            void input.dmk.disconnect({ sessionId }).catch(() => {});

            throw new Error('Ledger connect aborted');
        }

        return sessionId;
    }
);

export type OpenBitcoinAppInput = {
    dmk: DeviceManagementKit;
    sessionId: string;
};

export const openBitcoinApp = fromPromise<void, OpenBitcoinAppInput>(async ({ input, signal }) => {
    await awaitDeviceAction(
        input.dmk.executeDeviceAction({
            sessionId: input.sessionId,
            deviceAction: new OpenAppDeviceAction({ input: { appName: BITCOIN_APP_NAME } })
        }),
        signal
    );
});

export type VerifyLedgerFingerprintInput = {
    dmk: DeviceManagementKit;
    sessionId: string;
    expectedFingerprint: string;
};

export const verifyLedgerFingerprint = fromPromise<boolean, VerifyLedgerFingerprintInput>(
    async ({ input }) => {
        const fingerprint = await getLedgerMasterFingerprint(input.dmk, input.sessionId);

        return fingerprint === input.expectedFingerprint;
    }
);

export type RunLedgerSessionInput = {
    dmk: DeviceManagementKit;
    sessionId: string;
    run: (session: LedgerSession) => Promise<unknown>;
};

export const runLedgerSession = fromPromise<unknown, RunLedgerSessionInput>(({ input }) =>
    input.run({ dmk: input.dmk, sessionId: input.sessionId })
);
