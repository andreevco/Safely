import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';

import { useAppState } from '@safely/ux';

import { Blur } from '@mobile/shared/ui/Blur';
import { blurFreeze } from '@mobile/shared/utils';

const OverlayComponent = Platform.OS === 'ios' ? FullWindowOverlay : View;

const BLUR_INTENSITY = 100;
const FADE_OUT_DURATION = 200;

function useShouldBlur() {
    const { current } = useAppState();
    const [isAndroidBlurred, setIsAndroidBlurred] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'android') {
            return;
        }

        /**
         * Not ideal, that it's internal logic on BlurOverlay,
         * but on Android app state working a little bit different
         * Should decide is it good idea to move this logic into useAppState
         * and emit 'inactive' state on Android blur event
         * Maybe good point for consistency between platforms – 'inactive' state works similar on iOS
         */
        const blurSubscription = AppState.addEventListener('blur', () => {
            setIsAndroidBlurred(true);
        });

        const focusSubscription = AppState.addEventListener('focus', () => {
            setIsAndroidBlurred(false);
        });

        return () => {
            blurSubscription.remove();
            focusSubscription.remove();
        };
    }, []);

    return (
        current === 'background' ||
        ((isAndroidBlurred || current === 'inactive') && !blurFreeze.isFrozen)
    );
}

export const BlurOverlay = () => {
    const shouldBlur = useShouldBlur();

    const intensity = useSharedValue(0);
    const [isVisible, setIsVisible] = useState(false);

    const blurAnimatedProps = useAnimatedProps(() => ({
        intensity: intensity.value
    }));

    useEffect(() => {
        // Face ID changes state to 'inactive' for too long. So we need 'hack' with blur freeze for smooth UX
        if (shouldBlur) {
            setIsVisible(true);
            intensity.value = BLUR_INTENSITY;
            if (Platform.OS === 'android') {
                // On Android Blur is useless for recents, because OS is showing system snapshot.
                void ScreenCapture.preventScreenCaptureAsync();
            }
        } else {
            intensity.value = withTiming(0, { duration: FADE_OUT_DURATION }, finished => {
                if (finished) {
                    runOnJS(setIsVisible)(false);
                }
            });
            if (Platform.OS === 'android') {
                void ScreenCapture.allowScreenCaptureAsync();
            }
        }
    }, [shouldBlur, intensity]);

    if (!isVisible) {
        return null;
    }

    return (
        <OverlayComponent style={StyleSheet.absoluteFill}>
            <Blur
                blurAnimatedProps={blurAnimatedProps}
                style={StyleSheet.absoluteFill}
                pointerEvents="auto"
            />
        </OverlayComponent>
    );
};
