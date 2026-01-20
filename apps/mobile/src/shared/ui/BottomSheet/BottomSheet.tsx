import GHBottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './BottomSheet.styles';

type ModalSheetProps = {
    children: React.ReactNode;
    containerStyle?: ViewStyle;
    closeOnBackdropPress?: boolean;
};

export function BottomSheet({
    children,
    containerStyle,
    closeOnBackdropPress = true
}: ModalSheetProps) {
    const nav = useNavigation();
    const ref = useRef<GHBottomSheet>(null);
    const { theme } = useUnistyles();

    const index = useSharedValue(-1);

    const overlayStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                index.value,
                [-1, 0],
                ['transparent', theme.colors.background.overlay]
            )
        };
    });

    const dismissRoute = useCallback(() => {
        nav.goBack();
    }, [nav]);

    const requestClose = useCallback(() => {
        if (index.value >= 0) ref.current?.close();
    }, [index]);

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            {closeOnBackdropPress ? (
                <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
            ) : (
                <Pressable style={StyleSheet.absoluteFill} />
            )}

            <GHBottomSheet
                ref={ref}
                index={0}
                enableDynamicSizing
                enablePanDownToClose
                onClose={dismissRoute}
                onChange={i => {
                    index.value = i;
                }}
                backgroundStyle={styles.sheetBg}
                handleComponent={null}
                animatedIndex={index}
            >
                <BottomSheetView style={containerStyle}>{children}</BottomSheetView>
            </GHBottomSheet>
        </Animated.View>
    );
}
