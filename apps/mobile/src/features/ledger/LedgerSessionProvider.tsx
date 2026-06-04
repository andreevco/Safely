import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { DeviceManagementKitBuilder } from '@ledgerhq/device-management-kit';
import { RNBleTransportFactory } from '@ledgerhq/device-transport-kit-react-native-ble';
import type { ReactNode } from 'react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import type { Logger } from '@safely/sync';

import { DmkLoggerAdapter } from './DmkLoggerAdapter';

type LedgerSessionContextValue = {
    getDmk: () => DeviceManagementKit;
    selectedDevice: DiscoveredDevice | null;
    setSelectedDevice: (device: DiscoveredDevice | null) => void;
    sessionId: string | null;
    setSessionId: (sessionId: string | null) => void;
    reconnect: () => Promise<string>;
};

const LedgerSessionContext = createContext<LedgerSessionContextValue | null>(null);

type LedgerSessionProviderProps = {
    children: ReactNode;
    logger: Logger;
};

export const LedgerSessionProvider = (props: LedgerSessionProviderProps) => {
    const { children, logger } = props;

    const dmkRef = useRef<DeviceManagementKit | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);

    const getDmk = useCallback(() => {
        if (!dmkRef.current) {
            dmkRef.current = new DeviceManagementKitBuilder()
                .addTransport(RNBleTransportFactory)
                .addLogger(new DmkLoggerAdapter(logger.child('ledger-dmk')))
                .build();
        }

        return dmkRef.current;
    }, [logger]);

    useEffect(() => {
        return () => {
            dmkRef.current?.close();
            dmkRef.current = null;
        };
    }, []);

    const reconnect = useCallback(async () => {
        if (!selectedDevice) {
            throw new Error('No selected device to reconnect');
        }

        const id = await getDmk().connect({ device: selectedDevice });
        setSessionId(id);

        return id;
    }, [getDmk, selectedDevice]);

    const value = useMemo(
        () => ({ getDmk, selectedDevice, setSelectedDevice, sessionId, setSessionId, reconnect }),
        [getDmk, selectedDevice, sessionId, reconnect]
    );

    return <LedgerSessionContext.Provider value={value}>{children}</LedgerSessionContext.Provider>;
};

export const useLedgerSession = () => {
    const context = useContext(LedgerSessionContext);

    if (!context) {
        throw new Error('useLedgerSession must be used within LedgerSessionProvider');
    }

    return context;
};
