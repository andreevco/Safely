import { setStringAsync } from 'expo-clipboard';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

const HIDE_DURATION_MS = 2500;

type ToastState = { isVisible: boolean };
type CopyHandler = (address: string) => void;

const StateContext = createContext<ToastState | null>(null);
const TriggerContext = createContext<CopyHandler | null>(null);

type ReceiveCopyToastProviderProps = {
    children: ReactNode;
};

export const ReceiveCopyToastProvider = ({ children }: ReceiveCopyToastProviderProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHideTimeout = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimeout();
        hideTimeoutRef.current = setTimeout(() => setIsVisible(false), HIDE_DURATION_MS);
    }, [clearHideTimeout]);

    const copy = useCallback<CopyHandler>(
        address => {
            void setStringAsync(address);
            void notificationAsync(NotificationFeedbackType.Success);
            setIsVisible(true);
            scheduleHide();
        },
        [scheduleHide]
    );

    useEffect(() => () => clearHideTimeout(), [clearHideTimeout]);

    const state = useMemo<ToastState>(() => ({ isVisible }), [isVisible]);

    return (
        <StateContext.Provider value={state}>
            <TriggerContext.Provider value={copy}>{children}</TriggerContext.Provider>
        </StateContext.Provider>
    );
};

export const useReceiveCopy = (): CopyHandler => {
    const copy = useContext(TriggerContext);
    if (!copy) {
        throw new Error('useReceiveCopy must be used inside ReceiveCopyToastProvider');
    }
    return copy;
};

export const useReceiveCopyToastState = (): ToastState => {
    const state = useContext(StateContext);
    if (!state) {
        throw new Error('useReceiveCopyToastState must be used inside ReceiveCopyToastProvider');
    }
    return state;
};
