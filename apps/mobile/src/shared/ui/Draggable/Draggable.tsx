import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import React, { useCallback } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { SharedValue } from 'react-native-reanimated';

type DraggableRenderProps = {
    panGesture: ReturnType<typeof Gesture.Pan>;
};

type DraggableProps = {
    index: number;
    itemCount: number;
    draggedIndex: SharedValue<number | null>;
    offsetY: SharedValue<number>;
    moveItem: (fromIndex: number, toIndex: number) => void;
    children?: (props: DraggableRenderProps) => React.ReactNode;
    gap?: number;
};
const useDraggable = ({
    index,
    itemCount,
    draggedIndex,
    offsetY,
    moveItem,
    gap = 0
}: DraggableProps) => {
    const itemHeight = useSharedValue(0);
    const startY = useSharedValue(0);

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
        .minDistance(5)
        .onBegin(() => {
            'worklet';

            runOnJS(impactAsync)(ImpactFeedbackStyle.Medium);
            draggedIndex.value = index;
        })
        .onUpdate(e => {
            offsetY.value = getUpdatedOffsetY(e.translationY);
        })
        .onEnd(() => {
            'worklet';

            if (draggedIndex.value === null) return;

            const indexOffset = nextIndexToInsertAt.value - draggedIndex.value;

            const targetOffsetY = indexOffset * (itemHeight.value + gap);

            offsetY.value = withSpring(targetOffsetY, {}, () => {
                const fromIndex = draggedIndex.value;

                if (fromIndex === null) return;

                runOnJS(moveItem)(fromIndex, nextIndexToInsertAt.value);
            });
        })
        .onFinalize(() => {});

    const translateY = useDerivedValue(() => {
        'worklet';

        if (draggedIndex.value === null) return 0;
        if (draggedIndex.value === index) return withSpring(offsetY.value);

        return withSpring(movingDirection.value * (itemHeight.value + gap));
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

    return {
        animatedStyle,
        onLayout,
        panGesture
    };
};

export const Draggable = ({
    index,
    itemCount,
    draggedIndex,
    offsetY,
    moveItem,
    children,
    gap
}: DraggableProps) => {
    const { animatedStyle, onLayout, panGesture } = useDraggable({
        index,
        itemCount,
        draggedIndex,
        offsetY,
        moveItem,
        gap
    });

    if (!children) return null;

    return (
        <Animated.View onLayout={onLayout} style={[animatedStyle]}>
            {children({ panGesture: panGesture })}
        </Animated.View>
    );
};
