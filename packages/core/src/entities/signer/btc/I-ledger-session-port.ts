import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';

export interface LedgerSession {
    ledgerKit: DeviceManagementKit;
    sessionId: string;
    signal?: AbortSignal;
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
