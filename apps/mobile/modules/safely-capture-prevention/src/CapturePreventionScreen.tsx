import { requireNativeViewManager } from 'expo-modules-core';
import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect, useId, type ReactNode } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

export interface CapturePreventionScreenProps extends ViewProps {
    children?: ReactNode;
    onUnsupported?: () => void;
}

const AndroidCapturePreventionScreen = ({
    children,
    onUnsupported,
    ...props
}: CapturePreventionScreenProps) => {
    const tag = useId();

    useEffect(() => {
        preventScreenCaptureAsync(tag).catch(() => {
            onUnsupported?.();
        });
        return () => {
            void allowScreenCaptureAsync(tag);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag]);

    return <View {...props}>{children}</View>;
};

export const CapturePreventionScreen =
    Platform.OS === 'ios'
        ? requireNativeViewManager('SafelyCapturePrevention')!
        : AndroidCapturePreventionScreen;
