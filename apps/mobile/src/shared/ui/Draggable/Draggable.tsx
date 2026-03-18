import { impactAsync } from 'expo-haptics';
import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { ComposedGesture, Gesture, GestureType } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    Easing,
    withTiming
} from 'react-native-reanimated';
import { SharedValue } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

type DraggableRenderProps = {
    gesture: GestureType | ComposedGesture;
    underlayStyle: StyleProp<ViewStyle>;
};

type DraggableProps = {
    index: number;
    itemCount: number;
    draggedIndex: SharedValue<number | null>;
    offsetY: SharedValue<number>;
    moveItem: (fromIndex: number, toIndex: number) => void;
    children?: (props: DraggableRenderProps) => React.ReactNode;
    gap?: number;
    activationDelay?: number;
    onPress?: () => void;
    onDragStart?: () => void;
};
const useDraggable = ({
    index,
    itemCount,
    draggedIndex,
    offsetY,
    moveItem,
    gap = 0,
    activationDelay,
    onPress,
    onDragStart
}: DraggableProps) => {
    const itemHeight = useSharedValue(0);
    const startY = useSharedValue(0);
    const isBeingActive = useSharedValue(false);
    const { theme } = useUnistyles();

    const getUpdatedOffsetY = useCallback(
        (translationY: number) => {
            'worklet';

            const minOffset = -index * (itemHeight.value + gap);
            const maxOffset = (itemCount - 1 - index) * (itemHeight.value + gap);

            return Math.min(maxOffset, Math.max(minOffset, translationY + startY.value));
        },
        [index, itemCount, itemHeight, startY, gap]
    );

    const movingDirection = useDerivedValue(() => {
        'worklet';

        if (draggedIndex.value === null) return 0;

        const initialDraggedY = draggedIndex.value * (itemHeight.value + gap);
        const currentY = index * (itemHeight.value + gap);

        if (
            initialDraggedY < currentY &&
            currentY < initialDraggedY + offsetY.value + itemHeight.value / 2
        )
            return -1;
        if (
            initialDraggedY + offsetY.value - itemHeight.value / 2 <= currentY &&
            currentY < initialDraggedY
        )
            return 1;

        return 0;
    });

    const nextIndexToInsertAt = useDerivedValue(() => {
        'worklet';

        if (draggedIndex.value === null) return index;

        const initialDraggedY = draggedIndex.value * (itemHeight.value + gap);

        return Math.round((initialDraggedY + offsetY.value) / (itemHeight.value + gap));
    });

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(activationDelay ?? 0)
        .onBegin(() => {
            'worklet';

            isBeingActive.value = true;
            if (onDragStart) scheduleOnRN(onDragStart);
        })
        .onStart(() => {
            'worklet';

            scheduleOnRN(impactAsync);
            draggedIndex.value = index;
        })
        .onUpdate(e => {
            offsetY.value = getUpdatedOffsetY(e.translationY);
        })
        .onEnd(() => {
            'worklet';

            isBeingActive.value = false;

            if (draggedIndex.value === null) return;

            const indexOffset = nextIndexToInsertAt.value - draggedIndex.value;

            const targetOffsetY = indexOffset * (itemHeight.value + gap);

            offsetY.value = withTiming(
                targetOffsetY,
                { duration: 100, easing: Easing.linear },
                () => {
                    const fromIndex = draggedIndex.value;

                    if (fromIndex === null) return;

                    scheduleOnRN(moveItem, fromIndex, nextIndexToInsertAt.value);
                }
            );
        })
        .onFinalize(() => {});

    const tapGesture = Gesture.Tap().onEnd(() => {
        'worklet';

        if (onPress) scheduleOnRN(onPress);
    });

    const gesture = onPress ? Gesture.Exclusive(panGesture, tapGesture) : panGesture;

    const translateY = useDerivedValue(() => {
        'worklet';

        if (draggedIndex.value === null) return 0;
        if (draggedIndex.value === index) return offsetY.value;

        return withTiming(movingDirection.value * (itemHeight.value + gap), {
            duration: 100,
            easing: Easing.linear
        });
    });

    const animatedStyle = useAnimatedStyle(() => {
        const isBeingDragged = draggedIndex.value === index;

        return {
            transform: [{ translateY: translateY.value }],
            zIndex: isBeingDragged ? 10 : 0
        };
    });

    const onLayout = useCallback(
        (event: LayoutChangeEvent) => {
            itemHeight.value = event.nativeEvent.layout.height;
        },
        [itemHeight]
    );

    const underlayStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isBeingActive.value ? theme.colors.other.hover : 'transparent'
        };
    });

    return {
        animatedStyle,
        onLayout,
        gesture,
        underlayStyle
    };
};

export const Draggable = ({
    index,
    itemCount,
    draggedIndex,
    offsetY,
    moveItem,
    children,
    gap,
    activationDelay,
    onPress,
    onDragStart
}: DraggableProps) => {
    const { animatedStyle, onLayout, gesture, underlayStyle } = useDraggable({
        index,
        itemCount,
        draggedIndex,
        offsetY,
        moveItem,
        gap,
        activationDelay,
        onPress,
        onDragStart
    });

    if (!children) return null;

    return (
        <Animated.View onLayout={onLayout} style={[animatedStyle]}>
            {children({ gesture, underlayStyle })}
        </Animated.View>
    );
};
