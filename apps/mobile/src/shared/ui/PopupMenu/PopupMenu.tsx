import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { Blur } from '@mobile/shared/ui/Blur';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { OverlayContainer } from './OverlayContainer';
import { styles } from './PopupMenu.styles';
import { usePopupMenu } from './usePopupMenu';

export type PopupMenuRef = {
    close: () => void;
};

export type PopupMenuVariant = 'default' | 'fullWidth' | 'compact';

export type PopupMenuProps = {
    children: React.ReactNode;
    footer?: React.ReactNode;
    header?: React.ReactNode;
    touchable: React.ReactElement | ((progress: SharedValue<number>) => React.ReactElement);
    variant?: PopupMenuVariant;
    hasBackdrop?: boolean;
    menuMargin?: number;
};

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>((props, ref) => {
    const {
        children,
        footer,
        header,
        touchable: touchableProp,
        variant = 'default',
        hasBackdrop = true,
        menuMargin = 8
    } = props;
    const { height } = useWindowDimensions();
    const menu = usePopupMenu(height, menuMargin);

    useImperativeHandle(ref, () => ({ close: menu.close }), [menu.close]);

    styles.useVariants({ variant: variant === 'default' ? undefined : variant });

    const touchable =
        typeof touchableProp === 'function' ? touchableProp(menu.progress) : touchableProp;

    const overlayContent = (
        <>
            {hasBackdrop && (
                <Blur
                    blurAnimatedProps={menu.blurAnimatedProps}
                    style={[StyleSheet.absoluteFill, menu.blurAnimatedStyle]}
                />
            )}
            {header}
            <Pressable style={StyleSheet.absoluteFill} onPress={menu.close} />
            <Animated.View style={menu.triggerFrameStyle} pointerEvents="none">
                {touchable}
            </Animated.View>
            <Animated.View
                style={[
                    styles.menu,
                    styles.menuLayout,
                    variant === 'compact' ? menu.compactMenuAnimatedStyle : menu.menuAnimatedStyle
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
