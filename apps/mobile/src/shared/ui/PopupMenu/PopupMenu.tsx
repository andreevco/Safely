import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import { TouchableOpacity } from '../TouchableOpacity';
import { styles } from './PopupMenu.styles';

const OverlayComponent = Platform.OS === 'ios' ? FullWindowOverlay : View;
const MENU_MARGIN = 8;

export type PopupMenuRef = {
    close: () => void;
};

export type PopupMenuProps = {
    children: React.ReactNode;
    touchable: React.ReactElement;
};

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>((props, ref) => {
    const { children, touchable } = props;

    const triggerRef = useRef<View>(null);
    const [visible, setVisible] = useState(false);

    const triggerY = useSharedValue(0);
    const triggerHeight = useSharedValue(0);
    const menuHeight = useSharedValue(0);
    const scale = useSharedValue(0.35);
    const opacity = useSharedValue(0);

    const open = useCallback(() => {
        triggerRef.current?.measureInWindow((_x, y, _w, h) => {
            triggerY.value = y;
            triggerHeight.value = h;
            setVisible(true);
        });
    }, [triggerY, triggerHeight]);

    const toggleVisible = useCallback(() => {
        setVisible(prev => !prev);
    }, []);

    const close = useCallback(() => {
        opacity.value = withTiming(0, { duration: 120 });
        scale.value = withTiming(0.35, { duration: 150 }, finished => {
            if (finished) scheduleOnRN(toggleVisible);
        });
    }, [opacity, scale, toggleVisible]);

    useImperativeHandle(ref, () => ({ close }), [close]);

    const onMenuLayout = useCallback(
        (e: LayoutChangeEvent) => {
            menuHeight.value = e.nativeEvent.layout.height;
            opacity.value = withTiming(1, { duration: 180 });
            scale.value = withSpring(1, { damping: 22, stiffness: 380, mass: 0.7 });
        },
        [menuHeight, opacity, scale]
    );

    const height = useWindowDimensions().height;

    const menuAnimatedStyle = useAnimatedStyle(() => {
        const spaceBelow = height - (triggerY.value + triggerHeight.value + MENU_MARGIN);
        const showBelow =
            spaceBelow >= menuHeight.value || triggerY.value < menuHeight.value + MENU_MARGIN;

        return {
            top: showBelow
                ? triggerY.value + triggerHeight.value + MENU_MARGIN
                : triggerY.value - menuHeight.value - MENU_MARGIN,
            transformOrigin: showBelow ? '50% 0%' : '50% 100%',
            opacity: opacity.value,
            transform: [{ scale: scale.value }]
        };
    }, [height, triggerY, triggerHeight, menuHeight, opacity, scale]);

    return (
        <>
            <TouchableOpacity ref={triggerRef} onPress={open}>
                {touchable}
            </TouchableOpacity>

            {visible && (
                <OverlayComponent style={StyleSheet.absoluteFill}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={close} />
                    <Animated.View
                        style={[styles.menu, menuAnimatedStyle]}
                        onLayout={onMenuLayout}
                        pointerEvents="box-none"
                    >
                        {children}
                    </Animated.View>
                </OverlayComponent>
            )}
        </>
    );
});
