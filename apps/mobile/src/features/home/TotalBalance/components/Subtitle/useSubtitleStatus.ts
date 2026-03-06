import { useNetworkState } from 'expo-network';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export enum SubtitleStatus {
    ADDRESS = 'address',
    ADDRESS_COPIED = 'addressCopied',
    UPDATING = 'updating',
    NO_INTERNET = 'noInternet'
}

type Timer = ReturnType<typeof setTimeout> | null;

const STATUS_DEBOUNCE_MS = 300;
const COPY_FEEDBACK_MS = 1500;

interface UseSubtitleStatusParams {
    isFetching: boolean;
}

function clearTimer(ref: { current: Timer }) {
    if (ref.current !== null) {
        clearTimeout(ref.current);
        ref.current = null;
    }
}

function useDebouncedStatus(value: boolean, delayMs: number): boolean {
    const [deferred, setDeferred] = useState(false);
    const timerRef = useRef<Timer>(null);

    useEffect(() => {
        if (value) {
            timerRef.current = setTimeout(() => setDeferred(true), delayMs);
        } else {
            clearTimer(timerRef);
            setDeferred(false);
        }

        return () => clearTimer(timerRef);
    }, [value, delayMs]);

    return deferred;
}

export function useSubtitleStatus({ isFetching }: UseSubtitleStatusParams) {
    const networkState = useNetworkState();
    const [isCopied, setIsCopied] = useState(false);
    const copyTimerRef = useRef<Timer>(null);

    const showUpdating = useDebouncedStatus(isFetching, STATUS_DEBOUNCE_MS);
    const showNoInternet = useDebouncedStatus(
        !networkState.isInternetReachable,
        STATUS_DEBOUNCE_MS
    );

    useEffect(() => () => clearTimer(copyTimerRef), []);

    const status: SubtitleStatus = useMemo(() => {
        if (isCopied) return SubtitleStatus.ADDRESS_COPIED;
        if (showNoInternet) return SubtitleStatus.NO_INTERNET;
        if (showUpdating) return SubtitleStatus.UPDATING;
        return SubtitleStatus.ADDRESS;
    }, [isCopied, showNoInternet, showUpdating]);

    const onCopyAddress = useCallback(() => {
        clearTimer(copyTimerRef);
        setIsCopied(true);

        copyTimerRef.current = setTimeout(() => {
            copyTimerRef.current = null;
            setIsCopied(false);
        }, COPY_FEEDBACK_MS);
    }, []);

    return { status, onCopyAddress };
}
