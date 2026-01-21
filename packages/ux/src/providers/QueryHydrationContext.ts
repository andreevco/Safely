import { createContext, useContext } from 'react';

const QueryHydrationContext = createContext<{ hydratedAt: number | null }>({
    hydratedAt: null
});

export const QueryHydrationProvider = QueryHydrationContext.Provider;

export const useHydratedAt = () => useContext(QueryHydrationContext).hydratedAt;
