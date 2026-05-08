import { createNullPrototypeRecord, type JsonObject, type JsonValue } from '../json';
import {
    createContainerSlot,
    createOrderedArraySlot,
    createSlotMap,
    createTombstoneSlot,
    isJsonObject,
    isOrderedArraySlot,
    isTombstoneSlot,
    type ContainerSlot,
    type OrderedArraySlot,
    type Slot,
    SlotKind,
    type SlotMap
} from './slot';

export function cloneDeep<T>(value: T): T {
    if (Array.isArray(value)) {
        const items: readonly unknown[] = value;

        return items.map(item => (item === undefined ? null : cloneDeep(item))) as T;
    }

    if (value !== null && typeof value === 'object') {
        const cloned = createNullPrototypeRecord<unknown>();

        for (const key of Object.keys(value)) {
            const child = cloneDeep((value as Record<string, unknown>)[key]);

            if (child !== undefined) {
                cloned[key] = child;
            }
        }

        return cloned as T;
    }

    return value;
}

export function cloneSlot<T extends Slot>(slot: T): T {
    return cloneDeep(slot);
}

export function stripSlot(slot: Slot | undefined): JsonValue | undefined {
    if (slot === undefined) {
        return undefined;
    }

    if (isTombstoneSlot(slot)) {
        return undefined;
    }

    if (slot.s === SlotKind.Atomic) {
        return slot.v;
    }

    if (isOrderedArraySlot(slot)) {
        return stripOrderedArraySlot(slot);
    }

    const out = createNullPrototypeRecord<JsonValue>() as JsonObject;
    for (const key of Object.keys(slot.v)) {
        const child = slot.v[key];
        if (child === undefined) {
            continue;
        }

        const childValue = stripSlot(child);
        if (childValue !== undefined) {
            out[key] = childValue;
        }
    }

    return out;
}

export function createOrderedArrayItemSlot(
    order: number,
    value: JsonValue,
    timestamp: number,
    author: string
): ContainerSlot {
    return createContainerSlot(timestamp, author, {
        order: {
            s: SlotKind.Atomic,
            v: order,
            t: timestamp,
            a: author
        },
        value: slotFromJson(value, timestamp, author)
    });
}

export function orderedArrayItemOrder(item: Slot, id: string): number {
    if (isTombstoneSlot(item)) {
        throw new Error(`Ordered array item "${id}" is a tombstone`);
    }

    if (item.s !== SlotKind.Container) {
        throw new Error(`Ordered array item "${id}" must be a container slot`);
    }

    const order = item.v.order;
    if (
        order === undefined ||
        order.s !== SlotKind.Atomic ||
        typeof order.v !== 'number' ||
        !Number.isFinite(order.v)
    ) {
        throw new Error(`Ordered array item "${id}" must have a finite numeric order`);
    }

    return order.v;
}

export function orderedArrayItemValue(item: Slot, id: string): Slot {
    if (isTombstoneSlot(item)) {
        throw new Error(`Ordered array item "${id}" is a tombstone`);
    }

    if (item.s !== SlotKind.Container) {
        throw new Error(`Ordered array item "${id}" must be a container slot`);
    }

    const value = item.v.value;
    if (value === undefined) {
        throw new Error(`Ordered array item "${id}" must have a value slot`);
    }

    return value;
}

export function orderedArrayLiveIds(slot: OrderedArraySlot): string[] {
    return Object.keys(slot.v)
        .filter(id => {
            const item = slot.v[id];

            return item !== undefined && !isTombstoneSlot(item);
        })
        .sort((left, right) => {
            const leftItem = slot.v[left]!;
            const rightItem = slot.v[right]!;

            const orderDifference =
                orderedArrayItemOrder(leftItem, left) - orderedArrayItemOrder(rightItem, right);

            return orderDifference === 0 ? left.localeCompare(right) : orderDifference;
        });
}

function stripOrderedArraySlot(slot: OrderedArraySlot): JsonValue[] {
    return orderedArrayLiveIds(slot).map(id => {
        const item = slot.v[id];

        if (item === undefined) {
            throw new Error(`Ordered array item "${id}" is missing`);
        }

        const value = stripSlot(orderedArrayItemValue(item, id));

        if (value === undefined) {
            throw new Error(`Ordered array item "${id}" value cannot strip to undefined`);
        }

        return value;
    });
}

export function slotFromJson(
    value: JsonValue | undefined,
    timestamp: number,
    author: string
): Slot {
    if (Array.isArray(value)) {
        return orderedArraySlotFromJson(value, timestamp, author);
    }

    if (isJsonObject(value)) {
        const values: SlotMap = createSlotMap();

        for (const key of Object.keys(value)) {
            values[key] = slotFromJson(value[key], timestamp, author);
        }

        return createContainerSlot(timestamp, author, values);
    }

    if (value === undefined) {
        return createTombstoneSlot(timestamp, author);
    }

    return {
        s: SlotKind.Atomic,
        v: cloneDeep(value),
        t: timestamp,
        a: author
    };
}

export function orderedArraySlotFromJson(
    value: JsonValue[],
    timestamp: number,
    author: string
): OrderedArraySlot {
    const values: SlotMap = createSlotMap();
    const usedIds = new Set<string>();

    value.forEach((item, index) => {
        if (!isJsonObject(item) || typeof item.id !== 'string') {
            throw new Error(
                `Ordered array item at index ${index} must be an object with a string id`
            );
        }

        if (usedIds.has(item.id)) {
            throw new Error(`Ordered array item id "${item.id}" must be unique`);
        }

        usedIds.add(item.id);
        values[item.id] = createOrderedArrayItemSlot(index, item, timestamp, author);
    });

    return createOrderedArraySlot(timestamp, author, values);
}
