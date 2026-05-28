import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Defs, Mask, Rect, Svg } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { FrameCorner } from '../FrameCorner';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const PADDING = 16;
const SPRING_ANIMATION_CONFIG = {
    damping: 15,
    mass: 0.5,
    stiffness: 120
};

type CameraMaskProps = {
    barcodeValues: SharedValue<{
        width: number;
        height: number;
        x: number;
        y: number;
    }>;
};

export const CameraMask = (props: CameraMaskProps) => {
    const { barcodeValues } = props;

    const frameAnimatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            width: withSpring(barcodeValues.value.width + PADDING * 2, SPRING_ANIMATION_CONFIG),
            height: withSpring(barcodeValues.value.height + PADDING * 2, SPRING_ANIMATION_CONFIG),
            left: withSpring(barcodeValues.value.x - PADDING, SPRING_ANIMATION_CONFIG),
            top: withSpring(barcodeValues.value.y - PADDING, SPRING_ANIMATION_CONFIG),
            opacity: withTiming(barcodeValues.value.width > 0 ? 1 : 0)
        };
    });

    const maskAnimatedProps = useAnimatedProps(() => {
        return {
            width: withSpring(barcodeValues.value.width + PADDING * 2, SPRING_ANIMATION_CONFIG),
            height: withSpring(barcodeValues.value.height + PADDING * 2, SPRING_ANIMATION_CONFIG),
            x: withSpring(barcodeValues.value.x - PADDING, SPRING_ANIMATION_CONFIG),
            y: withSpring(barcodeValues.value.y - PADDING, SPRING_ANIMATION_CONFIG)
        };
    });

    return (
        <View style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
                <Defs>
                    <Mask id="mask" x={0} y={0} width="100%" height="100%">
                        <Rect width="100%" height="100%" fill="white" />
                        <AnimatedRect animatedProps={maskAnimatedProps} rx={24} fill="black" />
                    </Mask>
                </Defs>
                <Rect width="100%" height="100%" fill="rgba(0,0,0,0.64)" mask="url(#mask)" />
            </Svg>
            <Animated.View style={frameAnimatedStyle}>
                <FrameCorner position="topLeft" />
                <FrameCorner position="topRight" />
                <FrameCorner position="bottomLeft" />
                <FrameCorner position="bottomRight" />
            </Animated.View>
        </View>
    );
};
