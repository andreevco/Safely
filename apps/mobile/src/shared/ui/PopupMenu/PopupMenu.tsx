import { BlurView } from 'expo-blur';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
    LayoutChangeEvent,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    useWindowDimensions,
    View
} from 'react-native';
import Animated, {
    SharedValue,
    interpolateColor,
    useAnimatedProps,
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

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const MENU_MARGIN = 8;

export type PopupMenuRef = {
    close: () => void;
};

export type PopupMenuProps = {
    children: React.ReactNode;
    touchable: React.ReactElement | ((progress: SharedValue<number>) => React.ReactElement);
};

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>((props, ref) => {
    const { children, touchable: touchableProp } = props;

    const triggerRef = useRef<View>(null);
    const triggerFrame = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const [visible, setVisible] = useState(false);

    const triggerY = useSharedValue(0);
    const triggerHeight = useSharedValue(0);
    const menuHeight = useSharedValue(0);
    const scale = useSharedValue(0.35);
    const progress = useSharedValue(0);

    const open = useCallback(() => {
        triggerRef.current?.measureInWindow((x, y, w, h) => {
            const offsetY = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
            const adjustedY = y + offsetY;
            triggerY.value = adjustedY;
            triggerHeight.value = h;
            triggerFrame.current = { x, y: adjustedY, width: w, height: h };
            setVisible(true);
        });
    }, [triggerY, triggerHeight]);

    const toggleVisible = useCallback(() => {
        setVisible(prev => !prev);
    }, []);

    const close = useCallback(() => {
        progress.value = withTiming(0, { duration: 120 });
        scale.value = withTiming(0.35, { duration: 120 }, finished => {
            if (finished) scheduleOnRN(toggleVisible);
        });
    }, [progress, scale, toggleVisible]);

    useImperativeHandle(ref, () => ({ close }), [close]);

    const onMenuLayout = useCallback(
        (e: LayoutChangeEvent) => {
            menuHeight.value = e.nativeEvent.layout.height;
            progress.value = withTiming(1, { duration: 120 });
            scale.value = withSpring(1, { damping: 19, stiffness: 650, mass: 0.27 });
        },
        [menuHeight, progress, scale]
    );

    const height = useWindowDimensions().height;

    const touchable = typeof touchableProp === 'function' ? touchableProp(progress) : touchableProp;

    const blurAnimatedProps = useAnimatedProps(() => ({
        intensity: progress.value * 45
    }));

    const blurAnimatedStyle = useAnimatedStyle(
        () => ({
            backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', '#000000A3'])
        }),
        [progress]
    );

    const menuAnimatedStyle = useAnimatedStyle(() => {
        const spaceBelow = height - (triggerY.value + triggerHeight.value + MENU_MARGIN);
        const showBelow =
            spaceBelow >= menuHeight.value || triggerY.value < menuHeight.value + MENU_MARGIN;

        return {
            top: showBelow
                ? triggerY.value + triggerHeight.value + MENU_MARGIN
                : triggerY.value - menuHeight.value - MENU_MARGIN,
            transformOrigin: showBelow ? '50% 0%' : '50% 100%',
            opacity: progress.value,
            transform: [{ scale: scale.value }]
        };
    }, [height, triggerY, triggerHeight, menuHeight, progress, scale]);

    const overlayContent = (
        <>
            <AnimatedBlurView
                tint="dark"
                animatedProps={blurAnimatedProps}
                style={[styles.backdrop, blurAnimatedStyle]}
                pointerEvents="none"
            />
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
            <View
                style={{
                    position: 'absolute',
                    top: triggerFrame.current.y,
                    left: triggerFrame.current.x,
                    width: triggerFrame.current.width,
                    height: triggerFrame.current.height
                }}
                pointerEvents="none"
            >
                {touchable}
            </View>
            <Animated.View
                style={[styles.menu, menuAnimatedStyle]}
                onLayout={onMenuLayout}
                pointerEvents="box-none"
            >
                {children}
            </Animated.View>
        </>
    );

    return (
        <>
            <TouchableOpacity ref={triggerRef} onPress={open}>
                {touchable}
            </TouchableOpacity>
            {visible &&
                (Platform.OS === 'ios' ? (
                    <FullWindowOverlay>{overlayContent}</FullWindowOverlay>
                ) : (
                    <Modal transparent visible statusBarTranslucent onRequestClose={close}>
                        {overlayContent}
                    </Modal>
                ))}
        </>
    );
});
