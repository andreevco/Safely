import { FullScreenLoader } from '@mobile/shared/ui/FullScreenLoader';
import React, {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useState
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

const Overlay = Platform.OS === 'ios' ? FullWindowOverlay : View;

const LoaderContext = createContext<
    { isShown: boolean; show: () => void; hide: () => void } | undefined
>(undefined);

export const LoaderProvider: FC<PropsWithChildren> = ({ children }) => {
    const [isShown, setIsShown] = useState(false);

    const show = useCallback(() => setIsShown(true), []);
    const hide = useCallback(() => setIsShown(false), []);

    const value = useMemo(() => {
        return { show, hide, isShown };
    }, [show, hide, isShown]);

    return (
        <LoaderContext.Provider value={value}>
            {children}
            {isShown && (
                <Overlay style={StyleSheet.absoluteFill}>
                    <FullScreenLoader visible />
                </Overlay>
            )}
        </LoaderContext.Provider>
    );
};

export function useLoader() {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used inside LoaderProvider');
    }

    const { show, hide, isShown } = context;

    const withLoader = useCallback(
        async <T,>(callback: () => Promise<T>): Promise<T> => {
            try {
                show();
                await new Promise(resolve => setTimeout(resolve, 50));
                return await callback();
            } finally {
                hide();
            }
        },
        [show, hide]
    );

    return {
        showLoader: show,
        hideLoader: hide,
        isLoaderShown: isShown,
        withLoader
    };
}
