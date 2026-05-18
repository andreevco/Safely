import { BlurView, BlurViewProps } from 'expo-blur';
import { Platform, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

/* 
    As noted in expo-blur docs, dimezisBlurView may decrease 
    performance on Androids with < 30 SDK. 
    So it's better to fallback on these devices to plain View
    https://docs.expo.dev/versions/latest/sdk/blur-view/
*/
const SUPPORTS_BLUR =
    Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 30);

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export type BlurProps = {
    blurAnimatedProps: Partial<BlurViewProps>;
    blurAnimatedStyle: AnimatedStyle<ViewStyle>;
};

export const Blur = ({ blurAnimatedProps, blurAnimatedStyle }: BlurProps) => {
    return SUPPORTS_BLUR ? (
        <AnimatedBlurView
            experimentalBlurMethod={'dimezisBlurView'}
            tint={'dark'}
            style={blurAnimatedStyle}
            pointerEvents="none"
            animatedProps={blurAnimatedProps}
        />
    ) : (
        <Animated.View style={blurAnimatedStyle} />
    );
};
