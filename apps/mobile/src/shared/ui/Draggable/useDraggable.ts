import { impactAsync } from 'expo-haptics';
import { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
    Easing,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import type { DraggableProps } from './types';
import {
    clamp,
    computeTargetSlot,
    moveActiveToSlot,
    orderedIds,
    slotOf,
    topOfSlot,
    totalHeight
} from './worklets';

export const useDraggable = ({
    id,
    itemsCount,
    engine,
    gap = 0,
    onReorder,
    onMeasure,
    activationDelay,
    onPress,
    onDragStart,
    panRef,
    tapRef,
    blockExternalRefs
}: DraggableProps) => {
    const { positions, activeId, draggedOffsetY, heights } = engine;
    const startTop = useSharedValue(0);
    const isBeingActive = useSharedValue(false);
    const { theme } = useUnistyles();

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
            startTop.value = topOfSlot(
                positions.value,
                heights.value,
                slotOf(positions.value, id, 0),
                gap
            );
            draggedOffsetY.value = 0;
            activeId.value = id;
        })
        .onUpdate(e => {
            'worklet';

            if (activeId.value !== id) return;

            const ownHeight = heights.value[id] ?? 0;
            const total = totalHeight(positions.value, heights.value, gap);
            const minOffset = -startTop.value;
            const maxOffset = total - ownHeight - startTop.value;

            draggedOffsetY.value = clamp(e.translationY, minOffset, maxOffset);

            const draggedTop = startTop.value + draggedOffsetY.value;
            const targetSlot = computeTargetSlot(
                positions.value,
                heights.value,
                id,
                itemsCount,
                gap,
                draggedTop,
                draggedTop + ownHeight
            );

            if (targetSlot !== positions.value[id]) {
                positions.value = moveActiveToSlot(positions.value, id, targetSlot);
            }
        })
        .onEnd(() => {
            'worklet';

            isBeingActive.value = false;

            if (activeId.value !== id) return;

            const finalTop = topOfSlot(
                positions.value,
                heights.value,
                slotOf(positions.value, id, 0),
                gap
            );

            draggedOffsetY.value = withTiming(
                finalTop - startTop.value,
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

    if (panRef) panGesture.withRef(panRef);
    if (tapRef) tapGesture.withRef(tapRef);

    if (blockExternalRefs?.length) {
        panGesture.blocksExternalGesture(...blockExternalRefs);
        tapGesture.blocksExternalGesture(...blockExternalRefs);
    }

    const gesture = onPress ? Gesture.Exclusive(panGesture, tapGesture) : panGesture;

    const translateY = useDerivedValue(() => {
        'worklet';

        if (activeId.value === id) {
            return startTop.value + draggedOffsetY.value;
        }

        const slot = slotOf(positions.value, id, fallbackSlot.value);

        return withTiming(topOfSlot(positions.value, heights.value, slot, gap), {
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

            if (height > 0 && onMeasure) onMeasure(id, height);
        },
        [id, onMeasure]
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
