import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type { Heights, Positions, ReorderEngine } from './types';

const buildPositions = (ids: string[]): Positions => {
    const positions: Positions = {};

    ids.forEach((id, index) => {
        positions[id] = index;
    });

    return positions;
};

export function useReorderEngine(
    ids: string[],
    buildHeights: (prev: Heights) => Heights
): ReorderEngine {
    const draggedOffsetY = useSharedValue(0);
    const activeId = useSharedValue<string | null>(null);
    const heights = useSharedValue<Heights>(buildHeights({}));
    const positions = useSharedValue<Positions>(buildPositions(ids));

    const idsRef = useRef(ids);
    idsRef.current = ids;
    const buildHeightsRef = useRef(buildHeights);
    buildHeightsRef.current = buildHeights;

    const idsSignature = ids.join('|');

    useEffect(() => {
        if (activeId.value !== null) return;

        const next = buildPositions(idsRef.current);
        const current = positions.value;
        const sameOrder =
            Object.keys(next).length === Object.keys(current).length &&
            Object.keys(next).every(id => current[id] === next[id]);

        if (sameOrder) return;

        positions.value = next;
        heights.value = buildHeightsRef.current(heights.value);
    }, [idsSignature, positions, activeId, heights]);

    return { positions, activeId, draggedOffsetY, heights };
}
