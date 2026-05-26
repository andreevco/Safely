import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';

import { ToastOptions } from '@safely/ux';

import { Toast } from '@mobile/shared/ui';

import { styles, ShowInAnimation, ShowOutAnimation } from './ToastProvider.styles';
import { useToastServiceContext } from './ToastServiceProvider';

// On Android, we don't need to use the FullWindowOverlay component
const OverlayComponent = Platform.OS === 'ios' ? FullWindowOverlay : View;

const MIN_DURATION = 2500;
const MAX_DURATION = 7000;

function durationFromMessage(message: string): number {
    return Math.max(MIN_DURATION, Math.min(MAX_DURATION, message.length * 100));
}

type ToastState = {
    message: string;
    type?: 'success' | 'error';
};

export const ToastProvider = () => {
    const { setService } = useToastServiceContext();
    const [toast, setToast] = useState<ToastState | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHideTimeout = useCallback(() => {
        if (!hideTimeoutRef.current) {
            return;
        }

        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
    }, []);

    const hideToast = useCallback(() => {
        clearHideTimeout();
        setToast(null);
    }, [clearHideTimeout]);

    const scheduleHide = useCallback(
        (duration: number) => {
            clearHideTimeout();
            hideTimeoutRef.current = setTimeout(hideToast, duration);
        },
        [clearHideTimeout, hideToast]
    );

    const showToast = useCallback(
        (options: ToastOptions) => {
            setToast(options);
            scheduleHide(options.duration ?? durationFromMessage(options.message));
        },
        [scheduleHide]
    );

    useEffect(() => {
        setService({ show: showToast });
    }, [setService, showToast]);

    useEffect(() => () => clearHideTimeout(), [clearHideTimeout]);

    if (!toast) {
        return null;
    }

    return (
        <OverlayComponent style={StyleSheet.absoluteFill}>
            <Animated.View
                entering={ShowInAnimation}
                exiting={ShowOutAnimation}
                pointerEvents="box-none"
                style={styles.provider}
            >
                <Toast message={toast.message} onPress={hideToast} />
            </Animated.View>
        </OverlayComponent>
    );
};
