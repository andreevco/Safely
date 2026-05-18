import { BlurView, BlurViewProps } from 'expo-blur';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

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
    style?: StyleProp<ViewStyle>;
};

export const Blur = ({ blurAnimatedProps, style }: BlurProps) => {
    return SUPPORTS_BLUR ? (
        <AnimatedBlurView
            experimentalBlurMethod={'dimezisBlurView'}
            tint={'dark'}
            style={style}
            pointerEvents="none"
            animatedProps={blurAnimatedProps}
        />
    ) : (
        <Animated.View style={[style, blurAnimatedStyle]} pointerEvents="none" />
    );
};
