import { BlurView } from 'expo-blur';
import { forwardRef, useImperativeHandle } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';

import { TouchableOpacity } from '../TouchableOpacity';
import { styles } from './PopupMenu.styles';
import { usePopupMenu } from './usePopupMenu';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const OverlayComponent = Platform.OS === 'ios' ? FullWindowOverlay : View;

export type PopupMenuRef = {
    close: () => void;
};

export type PopupMenuProps = {
    children: React.ReactNode;
    touchable: React.ReactElement | ((progress: SharedValue<number>) => React.ReactElement);
};

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>((props, ref) => {
    const { children, touchable: touchableProp } = props;

    const {
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
    } = usePopupMenu();

    useImperativeHandle(ref, () => ({ close }), [close]);

    const touchable = typeof touchableProp === 'function' ? touchableProp(progress) : touchableProp;

    return (
        <>
            <Animated.View ref={triggerRef}>
                <TouchableOpacity onPress={open}>{touchable}</TouchableOpacity>
            </Animated.View>
            {visible && (
                <OverlayComponent style={StyleSheet.absoluteFill}>
                    <AnimatedBlurView
                        tint="dark"
                        animatedProps={backdropAnimatedProps}
                        style={[styles.backdrop, backdropAnimatedStyle]}
                        pointerEvents="none"
                    />
                    <Pressable style={StyleSheet.absoluteFill} onPress={close} />
                    <Animated.View style={triggerFrameStyle} pointerEvents="none">
                        {touchable}
                    </Animated.View>
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
