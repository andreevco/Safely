import { useCallback, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import {
    interpolateColor,
    measure,
    useAnimatedProps,
    useAnimatedRef,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

const MENU_MARGIN = 8;
const CLOSE_DURATION = 120;
const INITIAL_SCALE = 0.35;

export function usePopupMenu() {
    const triggerRef = useAnimatedRef<View>();
    const triggerFrame = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
    const [visible, setVisible] = useState(false);

    const menuHeight = useSharedValue(0);
    const scale = useSharedValue(INITIAL_SCALE);
    const progress = useSharedValue(0);

    const screenHeight = useWindowDimensions().height;

    const open = useCallback(() => {
        scheduleOnUI(function measureTrigger() {
            'worklet';
            const m = measure(triggerRef);
            if (m) {
                triggerFrame.value = {
                    x: m.pageX,
                    y: m.pageY,
                    width: m.width,
                    height: m.height
                };
                scheduleOnRN(toggleVisible);
            }
        });
    }, [triggerRef, triggerFrame]);

    const toggleVisible = useCallback(() => {
        setVisible(prev => !prev);
    }, []);

    const close = useCallback(() => {
        progress.value = withTiming(0, { duration: CLOSE_DURATION });
        scale.value = withTiming(INITIAL_SCALE, { duration: CLOSE_DURATION }, finished => {
            if (finished) scheduleOnRN(toggleVisible);
        });
    }, [progress, scale, toggleVisible]);

    const onMenuLayout = useCallback(
        (e: LayoutChangeEvent) => {
            menuHeight.value = e.nativeEvent.layout.height;
            progress.value = withTiming(1, { duration: CLOSE_DURATION });
            scale.value = withSpring(1, { damping: 19, stiffness: 650, mass: 0.27 });
        },
        [menuHeight, progress, scale]
    );

    const backdropAnimatedProps = useAnimatedProps(() => ({
        intensity: progress.value * 45
    }));

    const backdropAnimatedStyle = useAnimatedStyle(
        () => ({
            backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', '#000000A3'])
        }),
        [progress]
    );

    const triggerFrameStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        top: triggerFrame.value.y,
        left: triggerFrame.value.x,
        width: triggerFrame.value.width,
        height: triggerFrame.value.height
    }));

    const menuAnimatedStyle = useAnimatedStyle(() => {
        const { y: triggerY, height: triggerH } = triggerFrame.value;
        const spaceBelow = screenHeight - (triggerY + triggerH + MENU_MARGIN);
        const showBelow =
            spaceBelow >= menuHeight.value || triggerY < menuHeight.value + MENU_MARGIN;

        return {
            top: showBelow
                ? triggerY + triggerH + MENU_MARGIN
                : triggerY - menuHeight.value - MENU_MARGIN,
            transformOrigin: showBelow ? '50% 0%' : '50% 100%',
            opacity: progress.value,
            transform: [{ scale: scale.value }]
        };
    }, [screenHeight, triggerFrame, menuHeight, progress, scale]);

    return {
        triggerRef,
        visible,
        progress,
        open,
        close,
        onMenuLayout,
        backdropAnimatedProps,
        backdropAnimatedStyle,
        triggerFrameStyle,
        menuAnimatedStyle
    };
}
