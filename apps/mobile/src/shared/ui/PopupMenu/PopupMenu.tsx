import { BlurView } from 'expo-blur';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Platform, Pressable, useWindowDimensions } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { TouchableOpacity } from '@mobile/shared/ui';

import { OverlayContainer } from './OverlayContainer';
import { styles } from './PopupMenu.styles';
import { usePopupMenuPortal } from './PopupMenuPortal';
import { usePopupMenu } from './usePopupMenu';
import { useScreenContext } from '../Screen/Screen.context';

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
    const portal = usePopupMenuPortal();
    const { layout } = useScreenContext();
    const isPortalMode = portal !== null && Platform.OS === 'ios' && layout === 'modal';
    const menu = usePopupMenu(height, isPortalMode ? portal.containerRef : undefined);

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
            <Animated.View
                style={{
                    position: 'absolute',
                    top: menu.triggerFrame.value.y,
                    left: menu.triggerFrame.value.x,
                    width: menu.triggerFrame.value.width,
                    height: menu.triggerFrame.value.height
                }}
                pointerEvents="none"
            >
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

    if (isPortalMode && portal) {
        portal.contentRef.current = overlayContent;
    }

    useEffect(() => {
        if (!isPortalMode || !portal) return;

        portal.setVisible(menu.visible);

        return () => {
            portal.setVisible(false);
        };
    }, [isPortalMode, menu.visible, portal]);

    return (
        <>
            <TouchableOpacity ref={menu.triggerRef} onPress={menu.open}>
                {touchable}
            </TouchableOpacity>
            {!isPortalMode && menu.visible && (
                <OverlayContainer onClose={menu.close}>{overlayContent}</OverlayContainer>
            )}
        </>
    );
});
