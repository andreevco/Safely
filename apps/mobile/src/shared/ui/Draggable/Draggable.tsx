import Animated from 'react-native-reanimated';

import type { DraggableProps } from './types';
import { useDraggable } from './useDraggable';

export const Draggable = (props: DraggableProps) => {
    const { animatedStyle, onLayout, gesture, underlayStyle } = useDraggable(props);

    if (!props.children) return null;

    return (
        <Animated.View onLayout={onLayout} style={animatedStyle}>
            {props.children({ gesture, underlayStyle })}
        </Animated.View>
    );
};
