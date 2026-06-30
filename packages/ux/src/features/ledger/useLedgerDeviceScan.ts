import type { DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSessionProvider';
import { useAppContext } from '../../shared';

export type DiscoveryStatus = 'searching' | 'found';

export const useLedgerDeviceScan = () => {
    const { getLedgerKit } = useLedgerSession();
    const { ledgerTransport } = useAppContext();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        const subscription = getLedgerKit()
            .listenToAvailableDevices({ transport: ledgerTransport.transportIdentifier })
            .subscribe({
                next: setDevices,
                error: () => {}
            });

        return () => {
            subscription.unsubscribe();
            setDevices([]);
        };
    }, [getLedgerKit, ledgerTransport]);

    const status: DiscoveryStatus = devices.length > 0 ? 'found' : 'searching';

    return { devices, status };
};
