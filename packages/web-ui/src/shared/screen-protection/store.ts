import { useEffect } from 'react';
import { create } from 'zustand';

interface ScreenProtectionState {
    holders: number;
}

const useScreenProtectionStore = create<ScreenProtectionState>(() => ({ holders: 0 }));

export function useScreenProtection(): void {
    useEffect(() => {
        useScreenProtectionStore.setState(state => ({ holders: state.holders + 1 }));

        return () => useScreenProtectionStore.setState(state => ({ holders: state.holders - 1 }));
    }, []);
}

export function subscribeScreenProtection(listener: (isProtected: boolean) => void): () => void {
    listener(useScreenProtectionStore.getState().holders > 0);

    return useScreenProtectionStore.subscribe(state => listener(state.holders > 0));
}
