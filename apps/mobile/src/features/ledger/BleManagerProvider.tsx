import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import { BleManager } from 'react-native-ble-plx';

const BleManagerContext = createContext<(() => BleManager) | null>(null);

export const BleManagerProvider = ({ children }: { children: ReactNode }) => {
    const managerRef = useRef<BleManager | null>(null);

    const getBleManager = useCallback(() => {
        if (!managerRef.current) {
            managerRef.current = new BleManager();
        }

        return managerRef.current;
    }, []);

    return (
        <BleManagerContext.Provider value={getBleManager}>{children}</BleManagerContext.Provider>
    );
};

export const useBleManager = (): (() => BleManager) => {
    const getBleManager = useContext(BleManagerContext);

    if (!getBleManager) {
        throw new Error('useBleManager must be used within BleManagerProvider');
    }

    return getBleManager;
};
