import type { BlurViewProps } from 'expo-blur';
import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

/*
    As noted in expo-blur docs, dimezisBlurView may decrease
    performance on Androids with < 31 SDK.
    So it's better to fallback on these devices to plain View
    https://docs.expo.dev/versions/latest/sdk/blur-view/
*/
const SUPPORTS_BLUR =
    Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 31);

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export type BlurProps = {
    blurAnimatedProps: Partial<BlurViewProps>;
    style?: StyleProp<AnimatedStyle<ViewStyle>>;
    pointerEvents?: ViewProps['pointerEvents'];
    blurTarget?: RefObject<View | null>;
};

export const Blur = ({
    blurAnimatedProps,
    style,
    pointerEvents = 'none',
    blurTarget
}: BlurProps) => {
    return SUPPORTS_BLUR ? (
        <AnimatedBlurView
            blurMethod={'dimezisBlurViewSdk31Plus'}
            tint={'dark'}
            style={style}
            pointerEvents={pointerEvents}
            blurTarget={blurTarget}
            animatedProps={blurAnimatedProps}
        />
    ) : (
        <Animated.View style={style} pointerEvents={pointerEvents} />
    );
};
