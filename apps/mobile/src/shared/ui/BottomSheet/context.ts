import { createContext, useContext } from 'react';

export type BottomSheetContextType = {
    close: () => void;
};

export const BottomSheetContext = createContext<BottomSheetContextType | null>(null);

export function useBottomSheet() {
    const context = useContext(BottomSheetContext);
    if (!context) {
        throw new Error('useBottomSheet must be used within a BottomSheet');
    }
    return context;
}

export function useBottomSheetContext() {
    return useContext(BottomSheetContext);
}
