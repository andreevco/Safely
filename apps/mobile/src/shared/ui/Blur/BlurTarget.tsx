import { BlurTargetView } from 'expo-blur';
import { createContext, type ReactNode, type RefObject, useContext, useRef } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import { Platform } from 'react-native';

type BlurTargetRef = RefObject<View | null>;

const BlurTargetRefContext = createContext<BlurTargetRef | null>(null);

export const useBlurTargetRef = (): BlurTargetRef | null => useContext(BlurTargetRefContext);

type BlurTargetProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
};

export const BlurTarget = ({ children, style }: BlurTargetProps) => {
    const ref = useRef<View | null>(null);

    if (Platform.OS !== 'android') {
        return (
            <BlurTargetRefContext.Provider value={ref}>{children}</BlurTargetRefContext.Provider>
        );
    }

    return (
        <BlurTargetRefContext.Provider value={ref}>
            <BlurTargetView ref={ref} style={style}>
                {children}
            </BlurTargetView>
        </BlurTargetRefContext.Provider>
    );
};
