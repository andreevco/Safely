import { BlurView } from 'expo-blur';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { forwardRef, useImperativeHandle } from 'react';
import { Platform, Pressable, useWindowDimensions } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { TouchableOpacity } from '@mobile/shared/ui';

import { OverlayContainer } from './OverlayContainer';
import { styles } from './PopupMenu.styles';
import { usePopupMenu } from './usePopupMenu';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export type PopupMenuRef = {
    close: () => void;
};

export type PopupMenuVariant = 'default' | 'fullWidth';

export type PopupMenuProps = {
    children: React.ReactNode;
    footer?: React.ReactNode;
    header?: React.ReactNode;
    touchable: React.ReactElement | ((progress: SharedValue<number>) => React.ReactElement);
    variant?: PopupMenuVariant;
};

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>((props, ref) => {
    const { children, footer, header, touchable: touchableProp, variant = 'default' } = props;
    const { height } = useWindowDimensions();
    const menu = usePopupMenu(height);

    useImperativeHandle(ref, () => ({ close: menu.close }), [menu.close]);

    const touchable =
        typeof touchableProp === 'function' ? touchableProp(menu.progress) : touchableProp;

    const overlayContent = (
        <>
            {Platform.OS === 'ios' ? (
                <AnimatedBlurView
                    animatedProps={menu.blurAnimatedProps}
                    style={[styles.backdrop, menu.blurAnimatedStyle]}
                    pointerEvents="none"
                />
            ) : (
                <Animated.View style={[styles.backdrop, menu.blurAnimatedStyle]} />
            )}
            {header}
            <Pressable style={StyleSheet.absoluteFill} onPress={menu.close} />
            <Animated.View style={menu.triggerFrameStyle} pointerEvents="none">
                {touchable}
            </Animated.View>
            <Animated.View
                style={[
                    styles.menu,
                    variant === 'fullWidth' ? styles.menuFullWidth : styles.menuCentered,
                    menu.menuAnimatedStyle
                ]}
                onLayout={menu.onMenuLayout}
                pointerEvents="box-none"
            >
                {children}
            </Animated.View>
            {footer && (
                <Animated.View style={[styles.footer, menu.opacityAnimatedStyle]}>
                    {footer}
                </Animated.View>
            )}
        </>
    );

    return (
        <>
            <TouchableOpacity
                ref={menu.triggerRef}
                onPress={() => {
                    menu.open();
                    void impactAsync(ImpactFeedbackStyle.Medium);
                }}
            >
                {touchable}
            </TouchableOpacity>
            {menu.visible && (
                <OverlayContainer onClose={menu.close}>{overlayContent}</OverlayContainer>
            )}
        </>
    );
});
