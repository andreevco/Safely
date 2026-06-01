import { impactAsync } from 'expo-haptics';
import React, { useCallback } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
    Easing,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

type Positions = Record<string, number>;

type DraggableRenderProps = {
    gesture: GestureType | ComposedGesture;
    underlayStyle: StyleProp<ViewStyle>;
};

type DraggableProps = {
    id: string;
    itemsCount: number;
    positions: SharedValue<Positions>;
    activeId: SharedValue<string | null>;
    draggedOffsetY: SharedValue<number>;
    rowHeight: SharedValue<number>;
    gap?: number;
    onReorder: (orderedIds: string[]) => void;
    onMeasure?: (height: number) => void;
    activationDelay?: number;
    onPress?: () => void;
    onDragStart?: () => void;
    children?: (props: DraggableRenderProps) => React.ReactNode;
};

const clamp = (value: number, lower: number, upper: number) => {
    'worklet';

    return Math.max(lower, Math.min(value, upper));
};

const slotOf = (positions: Positions, id: string, fallback: number) => {
    'worklet';

    const slot = positions[id];

    return slot === undefined ? fallback : slot;
};

const idAtSlot = (positions: Positions, slot: number): string | null => {
    'worklet';

    for (const key in positions) {
        if (positions[key] === slot) return key;
    }

    return null;
};

const orderedIds = (positions: Positions): string[] => {
    'worklet';

    return Object.keys(positions).sort((a, b) => positions[a] - positions[b]);
};

const moveActiveToSlot = (
    positions: Positions,
    activeRowId: string,
    targetSlot: number
): Positions => {
    'worklet';

    const next = { ...positions };
    let current = next[activeRowId];

    while (current !== targetSlot) {
        const step = targetSlot > current ? 1 : -1;
        const neighbour = current + step;
        const neighbourId = idAtSlot(next, neighbour);

        if (neighbourId === null) break;

        next[neighbourId] = current;
        next[activeRowId] = neighbour;
        current = neighbour;
    }

    return next;
};

const useDraggable = ({
    id,
    itemsCount,
    positions,
    activeId,
    draggedOffsetY,
    rowHeight,
    gap = 0,
    onReorder,
    onMeasure,
    activationDelay,
    onPress,
    onDragStart
}: DraggableProps) => {
    const startSlot = useSharedValue(0);
    const isBeingActive = useSharedValue(false);
    const { theme } = useUnistyles();

    const stride = useDerivedValue(() => {
        'worklet';

        return rowHeight.value + gap;
    }, [gap]);

    const fallbackSlot = useDerivedValue(() => {
        'worklet';

        return slotOf(positions.value, id, 0);
    }, [id]);

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
            startSlot.value = slotOf(positions.value, id, 0);
            draggedOffsetY.value = 0;
            activeId.value = id;
        })
        .onUpdate(e => {
            'worklet';

            if (activeId.value !== id) return;

            const minOffset = -startSlot.value * stride.value;
            const maxOffset = (itemsCount - 1 - startSlot.value) * stride.value;

            draggedOffsetY.value = clamp(e.translationY, minOffset, maxOffset);

            const targetSlot = clamp(
                Math.round((startSlot.value * stride.value + draggedOffsetY.value) / stride.value),
                0,
                itemsCount - 1
            );

            if (targetSlot !== positions.value[id]) {
                positions.value = moveActiveToSlot(positions.value, id, targetSlot);
            }
        })
        .onEnd(() => {
            'worklet';

            isBeingActive.value = false;

            if (activeId.value !== id) return;

            const finalSlot = slotOf(positions.value, id, startSlot.value);
            const targetOffsetY = (finalSlot - startSlot.value) * stride.value;

            draggedOffsetY.value = withTiming(
                targetOffsetY,
                { duration: 150, easing: Easing.out(Easing.quad) },
                finished => {
                    if (!finished) return;

                    activeId.value = null;
                    draggedOffsetY.value = 0;
                    scheduleOnRN(onReorder, orderedIds(positions.value));
                }
            );
        })
        .onTouchesCancelled(() => {
            'worklet';

            isBeingActive.value = false;
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        'worklet';

        if (onPress) scheduleOnRN(onPress);
    });

    const gesture = onPress ? Gesture.Exclusive(panGesture, tapGesture) : panGesture;

    const translateY = useDerivedValue(() => {
        'worklet';

        if (activeId.value === id) {
            return startSlot.value * stride.value + draggedOffsetY.value;
        }

        const slot = slotOf(positions.value, id, fallbackSlot.value);

        return withTiming(slot * stride.value, {
            duration: 200,
            easing: Easing.out(Easing.quad)
        });
    });

    const animatedStyle = useAnimatedStyle(() => {
        const isBeingDragged = activeId.value === id;

        return {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: [{ translateY: translateY.value }],
            zIndex: isBeingDragged ? 10 : 0,
            elevation: isBeingDragged ? 10 : 0
        };
    });

    const onLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const height = event.nativeEvent.layout.height;

            if (height > 0 && onMeasure) onMeasure(height);
        },
        [onMeasure]
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

export const Draggable = (props: DraggableProps) => {
    const { animatedStyle, onLayout, gesture, underlayStyle } = useDraggable(props);

    if (!props.children) return null;

    return (
        <Animated.View onLayout={onLayout} style={animatedStyle}>
            {props.children({ gesture, underlayStyle })}
        </Animated.View>
    );
};
