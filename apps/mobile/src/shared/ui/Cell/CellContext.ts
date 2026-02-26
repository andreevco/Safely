import { createContext, useContext } from 'react';

type CellContextValue = {
    skeleton?: boolean;
};

export const CellContext = createContext<CellContextValue>({});

export const useCellContext = () => useContext(CellContext);
