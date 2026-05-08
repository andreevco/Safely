import type { JsonValue } from '../json';
import {
    createOrderedArraySlot,
    createOriginOrderedArray,
    createTombstoneSlot,
    isJsonObject,
    isOrderedArraySlot,
    isTombstoneSlot,
    ORDERED_ARRAY_ITEM_ID_KEY,
    SlotKind,
    type ContainerSlot,
    type OrderedArraySlot,
    type Slot
} from './slot';
import {
    cloneDeep,
    createOrderedArrayItemSlot,
    orderedArrayItemValue,
    orderedArrayLiveIds,
    slotFromJson,
    stripSlot
} from './slot-json';

export function orderedArrayIds(slot: Slot | undefined): string[] {
    if (slot === undefined || isTombstoneSlot(slot)) {
        return [];
    }

    if (!isOrderedArraySlot(slot)) {
        throw new Error('Draft value is not an ordered array slot');
    }

    return orderedArrayLiveIds(slot);
}

export function orderedArrayValueById(slot: Slot | undefined, id: string): JsonValue | undefined {
    if (slot === undefined || isTombstoneSlot(slot)) {
        return undefined;
    }

    if (!isOrderedArraySlot(slot)) {
        throw new Error('Draft value is not an ordered array slot');
    }

    const item = slot.v[id];
    if (item === undefined || isTombstoneSlot(item)) {
        return undefined;
    }

    return cloneDeep(stripSlot(orderedArrayItemValue(item, id)));
}

export function reorderOrderedArrayItems(
    slot: OrderedArraySlot,
    ids: readonly string[],
    timestamp: number,
    author: string
): void {
    const liveIds = orderedArrayLiveIds(slot);
    if (liveIds.length !== ids.length) {
        throw new Error(
            `Ordered array reorder expected ${liveIds.length} ids but received ${ids.length}`
        );
    }

    const liveIdSet = new Set(liveIds);
    const seenIds = new Set<string>();
    for (const id of ids) {
        if (seenIds.has(id)) {
            throw new Error(`Ordered array reorder contains duplicate id "${id}"`);
        }

        if (!liveIdSet.has(id)) {
            throw new Error(`Ordered array reorder contains unknown id "${id}"`);
        }

        seenIds.add(id);
    }

    rebuildDenseOrder(slot, ids, timestamp, author);
}

export function ensureOrderedArraySlot(
    slot: Slot | undefined,
    writeSlot: (slot: OrderedArraySlot) => void,
    timestamp: number,
    author: string
): OrderedArraySlot {
    if (isOrderedArraySlot(slot)) {
        return slot;
    }

    if (slot === undefined) {
        const created = createOriginOrderedArray();
        writeSlot(created);
        return created;
    }

    if (isTombstoneSlot(slot)) {
        const created = createOrderedArraySlot(timestamp, author);
        writeSlot(created);
        return created;
    }

    throw new Error('Draft value cannot be converted to an ordered array slot');
}

export function expectOrderedArraySlot(slot: Slot | undefined): OrderedArraySlot {
    if (!isOrderedArraySlot(slot)) {
        throw new Error('Draft value is not an ordered array slot');
    }

    return slot;
}

export function pushOrderedArrayItem(
    slot: OrderedArraySlot,
    item: JsonValue,
    timestamp: number,
    author: string
): void {
    const order = Math.max(0, maxLiveOrder(slot) + 1);
    addOrderedArrayItem(slot, order, item, timestamp, author);
}

export function insertOrderedArrayItem(
    slot: OrderedArraySlot,
    index: number,
    item: JsonValue,
    timestamp: number,
    author: string
): void {
    const id = addOrderedArrayItem(slot, index, item, timestamp, author);
    const ids = orderedArrayLiveIds(slot).filter(candidate => candidate !== id);
    ids.splice(clampIndex(index, ids.length + 1), 0, id);
    rebuildDenseOrder(slot, ids, timestamp, author);
}

export function moveOrderedArrayItem(
    slot: OrderedArraySlot,
    id: string,
    index: number,
    timestamp: number,
    author: string
): void {
    if (!hasLiveItem(slot, id)) {
        throw new Error(`Ordered array item "${id}" does not exist`);
    }

    const ids = orderedArrayLiveIds(slot).filter(candidate => candidate !== id);
    ids.splice(clampIndex(index, ids.length + 1), 0, id);
    rebuildDenseOrder(slot, ids, timestamp, author);
}

export function removeOrderedArrayItem(
    slot: OrderedArraySlot,
    id: string,
    timestamp: number,
    author: string
): void {
    if (!hasLiveItem(slot, id)) {
        throw new Error(`Ordered array item "${id}" does not exist`);
    }

    slot.v[id] = createTombstoneSlot(timestamp, author);
}

export function updateOrderedArrayItem(
    slot: OrderedArraySlot,
    id: string,
    item: JsonValue,
    timestamp: number,
    author: string
): void {
    const itemId = validateArrayItem(item);
    if (itemId !== id) {
        throw new Error(`Updated item id "${itemId}" must match "${id}"`);
    }

    const itemSlot = expectLiveItem(slot, id);
    itemSlot.v.value = slotFromJson(item, timestamp, author);
}

function addOrderedArrayItem(
    slot: OrderedArraySlot,
    order: number,
    item: JsonValue,
    timestamp: number,
    author: string
): string {
    const id = validateArrayItem(item);

    if (hasLiveItem(slot, id)) {
        throw new Error(`Ordered array item "${id}" already exists`);
    }

    slot.v[id] = createOrderedArrayItemSlot(order, item, timestamp, author);
    return id;
}

function validateArrayItem(item: JsonValue): string {
    if (!isJsonObject(item)) {
        throw new Error('Ordered array draft item must be an object');
    }

    const id = item[ORDERED_ARRAY_ITEM_ID_KEY];
    if (typeof id !== 'string') {
        throw new Error(`Ordered array draft item must have a string ${ORDERED_ARRAY_ITEM_ID_KEY}`);
    }

    return id;
}

function hasLiveItem(slot: OrderedArraySlot, id: string): boolean {
    const item = slot.v[id];

    return item !== undefined && !isTombstoneSlot(item);
}

function expectLiveItem(slot: OrderedArraySlot, id: string): ContainerSlot {
    const item = slot.v[id];
    if (item === undefined || isTombstoneSlot(item)) {
        throw new Error(`Ordered array item "${id}" does not exist`);
    }

    if (item.s !== SlotKind.Container) {
        throw new Error(`Ordered array item "${id}" must be a container slot`);
    }

    return item;
}

function maxLiveOrder(slot: OrderedArraySlot): number {
    return orderedArrayLiveIds(slot).reduce((max, id) => {
        const item = slot.v[id];
        if (item === undefined) {
            return max;
        }

        const orderSlot =
            item.s === SlotKind.Container && item.v.order?.s === SlotKind.Atomic
                ? item.v.order
                : undefined;

        return typeof orderSlot?.v === 'number' ? Math.max(max, orderSlot.v) : max;
    }, -1);
}

function rebuildDenseOrder(
    slot: OrderedArraySlot,
    ids: readonly string[],
    timestamp: number,
    author: string
): void {
    ids.forEach((id, order) => {
        const item = expectLiveItem(slot, id);
        item.v.order = {
            s: SlotKind.Atomic,
            v: order,
            t: timestamp,
            a: author
        };
    });
}

function clampIndex(index: number, length: number): number {
    if (!Number.isInteger(index)) {
        throw new Error('Ordered array index must be an integer');
    }

    return Math.max(0, Math.min(index, length));
}
