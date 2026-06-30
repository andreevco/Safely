import type { ReactNode, RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';

export type Positions = Record<string, number>;
export type Heights = Record<string, number>;

export type ReorderEngine = {
    positions: SharedValue<Positions>;
    activeId: SharedValue<string | null>;
    draggedOffsetY: SharedValue<number>;
    heights: SharedValue<Heights>;
};

export type DraggableRenderProps = {
    gesture: GestureType | ComposedGesture;
    underlayStyle: StyleProp<AnimatedStyle<ViewStyle>>;
};

export type DraggableProps = {
    id: string;
    itemsCount: number;
    engine: ReorderEngine;
    gap?: number;
    onReorder: (orderedIds: string[]) => void;
    onMeasure?: (id: string, height: number) => void;
    activationDelay?: number;
    onPress?: () => void;
    onDragStart?: () => void;
    panRef?: RefObject<GestureType | undefined>;
    tapRef?: RefObject<GestureType | undefined>;
    blockExternalRefs?: RefObject<GestureType | undefined>[];
    children?: (props: DraggableRenderProps) => ReactNode;
};
