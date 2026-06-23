import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
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
import { BleManager } from 'react-native-ble-plx';
import type { ActorRefFrom } from 'xstate';
import { createActor } from 'xstate';

import type { ILedgerSessionPort, LedgerSession } from '@safely/core';
import type { Logger } from '@safely/sync';
import { LedgerSessionPortProvider } from '@safely/ux';

import { createLedgerKit } from './createLedgerKit';
import { isLedgerSessionConnected } from './is-ledger-session-connected';
import { ledgerSigningMachine } from './machine';

export type LedgerSigningActor = ActorRefFrom<typeof ledgerSigningMachine>;

type LedgerSigningContextValue = {
    activeActor: LedgerSigningActor | null;
};

type LedgerSessionContextValue = {
    getLedgerKit: () => DeviceManagementKit;
    getBleManager: () => BleManager;
    selectedDevice: DiscoveredDevice | null;
    setSelectedDevice: (device: DiscoveredDevice | null) => void;
    sessionId: string | null;
    setSessionId: (sessionId: string | null) => void;
    findMorePortfolioId: string | null;
    setFindMorePortfolioId: (portfolioId: string | null) => void;
};

const LedgerSigningContext = createContext<LedgerSigningContextValue | null>(null);
const LedgerSessionContext = createContext<LedgerSessionContextValue | null>(null);

type LedgerSigningProviderProps = {
    children: ReactNode;
    logger: Logger;
    openConnectScreen: () => void;
};

export const LedgerSigningProvider = (props: LedgerSigningProviderProps) => {
    const { children, logger, openConnectScreen } = props;

    const [sessionId, setSessionIdState] = useState<string | null>(null);
    const [activeActor, setActiveActor] = useState<LedgerSigningActor | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
    const [findMorePortfolioId, setFindMorePortfolioId] = useState<string | null>(null);
    const ledgerKitRef = useRef<DeviceManagementKit | null>(null);
    const bleManagerRef = useRef<BleManager | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const setSessionId = useCallback((id: string | null) => {
        sessionIdRef.current = id;
        setSessionIdState(id);
    }, []);

    const getLedgerKit = useCallback(() => {
        if (!ledgerKitRef.current) {
            ledgerKitRef.current = createLedgerKit(logger);
        }

        return ledgerKitRef.current;
    }, [logger]);

    const getBleManager = useCallback(() => {
        if (!bleManagerRef.current) {
            bleManagerRef.current = new BleManager();
        }

        return bleManagerRef.current;
    }, []);

    useEffect(() => {
        return () => {
            ledgerKitRef.current?.close();
            ledgerKitRef.current = null;
            bleManagerRef.current = null;
        };
    }, []);

    const withSession = useCallback(
        <T,>(
            params: { expectedFingerprint: string },
            run: (session: LedgerSession) => Promise<T>
        ): Promise<T> =>
            new Promise<T>((resolve, reject) => {
                void (async () => {
                    const ledgerKit = getLedgerKit();
                    const reusableSessionId =
                        sessionIdRef.current &&
                        (await isLedgerSessionConnected(ledgerKit, sessionIdRef.current))
                            ? sessionIdRef.current
                            : null;

                    const actor = createActor(ledgerSigningMachine, {
                        input: {
                            ledgerKit,
                            expectedFingerprint: params.expectedFingerprint,
                            sessionId: reusableSessionId,
                            run
                        }
                    });

                    actor.subscribe(snapshot => {
                        if (snapshot.context.sessionId) {
                            setSessionId(snapshot.context.sessionId);
                        }

                        if (snapshot.status !== 'done') {
                            return;
                        }

                        actor.stop();

                        const { error, result } = snapshot.output;

                        if (error) {
                            reject(
                                error instanceof Error ? error : new Error('Ledger signing failed')
                            );
                        } else {
                            resolve(result as T);
                        }
                    });

                    setActiveActor(actor);
                    actor.start();
                    openConnectScreen();
                })();
            }),
        [getLedgerKit, openConnectScreen, setSessionId]
    );

    const port = useMemo<ILedgerSessionPort>(() => ({ withSession }), [withSession]);

    const signingValue = useMemo(() => ({ activeActor }), [activeActor]);

    const sessionValue = useMemo(
        () => ({
            getLedgerKit,
            getBleManager,
            selectedDevice,
            setSelectedDevice,
            sessionId,
            setSessionId,
            findMorePortfolioId,
            setFindMorePortfolioId
        }),
        [getLedgerKit, getBleManager, selectedDevice, sessionId, setSessionId, findMorePortfolioId]
    );

    return (
        <LedgerSessionPortProvider port={port}>
            <LedgerSessionContext.Provider value={sessionValue}>
                <LedgerSigningContext.Provider value={signingValue}>
                    {children}
                </LedgerSigningContext.Provider>
            </LedgerSessionContext.Provider>
        </LedgerSessionPortProvider>
    );
};

export const useLedgerSigning = (): LedgerSigningContextValue => {
    const context = useContext(LedgerSigningContext);

    if (!context) {
        throw new Error('useLedgerSigning must be used within LedgerSigningProvider');
    }

    return context;
};

export const useLedgerSession = (): LedgerSessionContextValue => {
    const context = useContext(LedgerSessionContext);

    if (!context) {
        throw new Error('useLedgerSession must be used within LedgerSigningProvider');
    }

    return context;
};
