import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';

import { useAppState } from '@safely/ux';

import { Blur } from '@mobile/shared/ui/Blur';
import { blurFreeze } from '@mobile/shared/utils';

const OverlayComponent = Platform.OS === 'ios' ? FullWindowOverlay : View;

const BLUR_INTENSITY = 100;
const FADE_OUT_DURATION = 200;

export const BlurOverlay = () => {
    const { current } = useAppState();
    const intensity = useSharedValue(0);
    const [isVisible, setIsVisible] = useState(false);

    const blurAnimatedProps = useAnimatedProps(() => ({
        intensity: intensity.value
    }));

    useEffect(() => {
        // Face ID changes state to 'inactive' for too long. So we need 'hack' with blur freeze for smooth UX
        const shouldBlur =
            current === 'background' || (current === 'inactive' && !blurFreeze.isFrozen);

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
    }, [current, intensity]);

    if (!isVisible) {
        return null;
    }

    return (
        <OverlayComponent pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Blur blurAnimatedProps={blurAnimatedProps} style={StyleSheet.absoluteFill} />
        </OverlayComponent>
    );
};
