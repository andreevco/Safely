import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';

export interface LedgerSession {
    dmk: DeviceManagementKit;
    sessionId: string;
}

export interface ILedgerSessionPort {
    withSession<T>(
        params: { expectedFingerprint: string },
        run: (session: LedgerSession) => Promise<T>
    ): Promise<T>;
}

export type LedgerAccountContext = {
    xpub: string;
    accountIndex: number;
    masterFingerprint: string;
};
