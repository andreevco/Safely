import type { DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSessionProvider';
import { useAppContext } from '../../shared';

export type DiscoveryStatus = 'searching' | 'found' | 'timedOut';

const SCAN_TIMEOUT_MS = 30_000;

export const useLedgerDeviceScan = () => {
    const { getLedgerKit } = useLedgerSession();
    const { ledgerTransport } = useAppContext();
    const [isTimedOut, setIsTimedOut] = useState(false);
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        const subscription = getLedgerKit()
            .listenToAvailableDevices({ transport: ledgerTransport.transportIdentifier })
            .subscribe({
                next: setDevices,
                error: () => setIsTimedOut(true)
            });

        const timer = setTimeout(() => {
            subscription.unsubscribe();
            setIsTimedOut(true);
        }, SCAN_TIMEOUT_MS);

        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
            setDevices([]);
        };
    }, [getLedgerKit, ledgerTransport]);

    const status: DiscoveryStatus = isTimedOut
        ? 'timedOut'
        : devices.length > 0
          ? 'found'
          : 'searching';

    return { devices, status };
};
