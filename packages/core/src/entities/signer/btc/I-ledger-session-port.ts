import type { DeviceManagementKit } from '@ledgerhq/device-management-kit';

import type { BtcNetwork } from '../../blockchain';

export interface LedgerSession {
    ledgerKit: DeviceManagementKit;
    sessionId: string;
    signal?: AbortSignal;
}

export interface ILedgerSessionPort {
    withSession<T>(
        params: { expectedFingerprint: Buffer },
        run: (session: LedgerSession) => Promise<T>
    ): Promise<T>;
}

export type LedgerAccountContext = {
    xpub: string;
    network: BtcNetwork;
    accountIndex: number;
    masterFingerprint: Buffer;
};
