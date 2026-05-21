import type { ReactNode } from 'react';
import { Modal, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';

interface OverlayContainerProps {
    children: ReactNode;
    onClose: () => void;
}

export function OverlayContainer(props: OverlayContainerProps) {
    const { children, onClose } = props;

    if (Platform.OS === 'ios') {
        return <FullWindowOverlay>{children}</FullWindowOverlay>;
    }

    return (
        <Modal transparent visible statusBarTranslucent onRequestClose={onClose}>
            <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                {children}
            </GestureHandlerRootView>
        </Modal>
    );
}
