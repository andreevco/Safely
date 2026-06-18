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
import type { ActorRefFrom } from 'xstate';
import { createActor } from 'xstate';

import type { ILedgerSessionPort, LedgerSession } from '@safely/core';
import type { Logger } from '@safely/sync';
import { LedgerSessionPortProvider } from '@safely/ux';

import { createLedgerKit } from './createLedgerKit';
import { ledgerSigningMachine } from './machine';

export type LedgerSigningActor = ActorRefFrom<typeof ledgerSigningMachine>;

type LedgerSigningContextValue = {
    activeActor: LedgerSigningActor | null;
};

type LedgerSessionContextValue = {
    getLedgerKit: () => DeviceManagementKit;
    selectedDevice: DiscoveredDevice | null;
    setSelectedDevice: (device: DiscoveredDevice | null) => void;
    sessionId: string | null;
    setSessionId: (sessionId: string | null) => void;
    disconnectSession: () => void;
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

    const disconnectSession = useCallback(() => {
        if (sessionIdRef.current) {
            void getLedgerKit()
                .disconnect({ sessionId: sessionIdRef.current })
                .catch(() => {});
            setSessionId(null);
        }
    }, [getLedgerKit, setSessionId]);

    useEffect(() => {
        return () => {
            ledgerKitRef.current?.close();
            ledgerKitRef.current = null;
        };
    }, []);

    const withSession = useCallback(
        <T,>(
            params: { expectedFingerprint: string },
            run: (session: LedgerSession) => Promise<T>
        ): Promise<T> =>
            new Promise<T>((resolve, reject) => {
                disconnectSession();

                const actor = createActor(ledgerSigningMachine, {
                    input: {
                        ledgerKit: getLedgerKit(),
                        expectedFingerprint: params.expectedFingerprint,
                        run
                    }
                });

                actor.subscribe(snapshot => {
                    if (snapshot.status !== 'done') {
                        return;
                    }

                    actor.stop();

                    const { error, result } = snapshot.output;

                    if (error) {
                        reject(error instanceof Error ? error : new Error('Ledger signing failed'));
                    } else {
                        resolve(result as T);
                    }
                });

                setActiveActor(actor);
                actor.start();
                openConnectScreen();
            }),
        [disconnectSession, getLedgerKit, openConnectScreen]
    );

    const port = useMemo<ILedgerSessionPort>(() => ({ withSession }), [withSession]);

    const signingValue = useMemo(() => ({ activeActor }), [activeActor]);

    const sessionValue = useMemo(
        () => ({
            getLedgerKit,
            selectedDevice,
            setSelectedDevice,
            sessionId,
            setSessionId,
            disconnectSession,
            findMorePortfolioId,
            setFindMorePortfolioId
        }),
        [
            getLedgerKit,
            selectedDevice,
            sessionId,
            setSessionId,
            disconnectSession,
            findMorePortfolioId
        ]
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
