import type { Heights, Positions } from './types';

export const clamp = (value: number, lower: number, upper: number) => {
    'worklet';

    return Math.max(lower, Math.min(value, upper));
};

export const slotOf = (positions: Positions, id: string, fallback: number) => {
    'worklet';

    const slot = positions[id];

    return slot === undefined ? fallback : slot;
};

export const idAtSlot = (positions: Positions, slot: number): string | null => {
    'worklet';

    for (const key in positions) {
        if (positions[key] === slot) return key;
    }

    return null;
};

export const orderedIds = (positions: Positions): string[] => {
    'worklet';

    return Object.keys(positions).sort((a, b) => positions[a] - positions[b]);
};

export const topOfSlot = (
    positions: Positions,
    heights: Heights,
    slot: number,
    gap: number
): number => {
    'worklet';

    let top = 0;

    for (const key in positions) {
        if (positions[key] < slot) {
            top += (heights[key] ?? 0) + gap;
        }
    }

    return top;
};

export const totalHeight = (positions: Positions, heights: Heights, gap: number): number => {
    'worklet';

    let sum = 0;
    let count = 0;

    for (const key in positions) {
        sum += heights[key] ?? 0;
        count += 1;
    }

    return count > 0 ? sum + (count - 1) * gap : 0;
};

export const computeTargetSlot = (
    positions: Positions,
    heights: Heights,
    id: string,
    itemsCount: number,
    gap: number,
    draggedTop: number,
    draggedBottom: number
): number => {
    'worklet';

    const currentSlot = positions[id];
    let target = currentSlot;

    for (let slot = currentSlot + 1; slot < itemsCount; slot++) {
        const slotId = idAtSlot(positions, slot);
        if (slotId === null) break;

        const midpoint = topOfSlot(positions, heights, slot, gap) + (heights[slotId] ?? 0) / 2;

        if (draggedBottom > midpoint) target = slot;
        else break;
    }

    if (target !== currentSlot) return target;

    for (let slot = currentSlot - 1; slot >= 0; slot--) {
        const slotId = idAtSlot(positions, slot);
        if (slotId === null) break;

        const midpoint = topOfSlot(positions, heights, slot, gap) + (heights[slotId] ?? 0) / 2;

        if (draggedTop < midpoint) target = slot;
        else break;
    }

    return target;
};

export const moveActiveToSlot = (
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
