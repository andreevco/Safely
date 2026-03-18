import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StatusBar } from 'react-native';
import { View } from 'react-native';
import {
    interpolateColor,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MENU_MARGIN = 8;

export const usePopupMenu = (screenHeight: number) => {
    const triggerRef = useRef<View>(null);
    const triggerFrame = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
    const [visible, setVisible] = useState(false);

    const triggerHeight = useSharedValue(0);
    const menuHeight = useSharedValue(0);
    const scale = useSharedValue(0.75);
    const progress = useSharedValue(0);

    const open = useCallback(() => {
        triggerRef.current?.measureInWindow((x, y, w, h) => {
            const offsetY = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
            const adjustedY = y + offsetY;
            triggerHeight.value = h;
            triggerFrame.value = { x, y: adjustedY, width: w, height: h };
            setVisible(true);
        });
    }, [triggerHeight]);

    const hide = useCallback(() => {
        setVisible(false);
    }, []);

    const close = useCallback(() => {
        progress.value = withTiming(0, { duration: 50 });
        scale.value = withTiming(0.75, { duration: 50 }, finished => {
            if (finished) {
                scheduleOnRN(hide);
            }
        });
    }, [progress, scale, hide]);

    const onMenuLayout = useCallback(
        (e: LayoutChangeEvent) => {
            menuHeight.value = e.nativeEvent.layout.height;
            progress.value = withTiming(1, { duration: 50 });
            scale.value = withTiming(1, { duration: 50 });
        },
        [menuHeight, progress, scale]
    );

    const blurAnimatedProps = useAnimatedProps(() => ({
        intensity: progress.value * 80
    }));

    const blurAnimatedStyle = useAnimatedStyle(
        () => ({
            backgroundColor: interpolateColor(
                progress.value,
                [0, 1],
                ['transparent', 'rgba(0, 0, 0, 0.85)']
            )
        }),
        [progress]
    );

    const opacityAnimatedStyle = useAnimatedStyle(
        () => ({
            opacity: progress.value
        }),
        [progress]
    );

    const menuAnimatedStyle = useAnimatedStyle(() => {
        const spaceBelow =
            screenHeight - (triggerFrame.value.y + triggerHeight.value + MENU_MARGIN);
        const showBelow =
            spaceBelow >= menuHeight.value || triggerFrame.value.y < menuHeight.value + MENU_MARGIN;

        return {
            top: showBelow
                ? triggerFrame.value.y + triggerHeight.value + MENU_MARGIN
                : triggerFrame.value.y - menuHeight.value - MENU_MARGIN,
            transformOrigin: showBelow ? '50% 0%' : '50% 100%',
            opacity: progress.value,
            transform: [{ scale: scale.value }]
        };
    }, [screenHeight, triggerFrame, triggerHeight, menuHeight, progress, scale]);

    return {
        visible,
        triggerRef,
        triggerFrame,
        progress,
        open,
        close,
        onMenuLayout,
        blurAnimatedProps,
        blurAnimatedStyle,
        opacityAnimatedStyle,
        menuAnimatedStyle
    };
};
