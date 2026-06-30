import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { ILedgerSessionPort } from '@safely/core';

const LedgerSessionPortContext = createContext<ILedgerSessionPort | null>(null);

type LedgerSessionPortProviderProps = {
    port: ILedgerSessionPort;
    children: ReactNode;
};

export const LedgerSessionPortProvider = (props: LedgerSessionPortProviderProps) => {
    return (
        <LedgerSessionPortContext.Provider value={props.port}>
            {props.children}
        </LedgerSessionPortContext.Provider>
    );
};

export const useLedgerSessionPort = (): ILedgerSessionPort => {
    const port = useContext(LedgerSessionPortContext);

    if (!port) {
        throw new Error('useLedgerSessionPort must be used within LedgerSessionPortProvider');
    }

    return port;
};
