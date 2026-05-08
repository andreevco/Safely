import { createNullPrototypeRecord, type JsonObject, type JsonValue } from '../json';

export const SlotKind = {
    Atomic: 0,
    Container: 1,
    Tombstone: 2
} as const;

export type SlotKindValue = (typeof SlotKind)[keyof typeof SlotKind];

export interface AtomicSlot {
    s: typeof SlotKind.Atomic;
    v: JsonValue;
    t: number;
    a: string;
}

export interface TombstoneSlot {
    s: typeof SlotKind.Tombstone;
    t: number;
    a: string;
}

export interface ContainerSlot {
    s: typeof SlotKind.Container;
    v: SlotMap;
    t: number;
    a: string;
}

export type Slot = AtomicSlot | TombstoneSlot | ContainerSlot;
export type SlotMap = { [key: string]: Slot | undefined };

export function createSlotMap(): SlotMap {
    return createNullPrototypeRecord<Slot | undefined>();
}

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
    return (
        value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)
    );
}

export function isContainerSlot(slot: Slot | undefined): slot is ContainerSlot {
    return slot !== undefined && slot.s === SlotKind.Container;
}

export function isTombstoneSlot(slot: Slot | undefined): slot is TombstoneSlot {
    return slot !== undefined && slot.s === SlotKind.Tombstone;
}

export function createContainerSlot(
    timestamp: number,
    author: string,
    values: SlotMap = createSlotMap()
): ContainerSlot {
    return { s: SlotKind.Container, v: values, t: timestamp, a: author };
}

export function createOriginContainer(values: SlotMap = createSlotMap()): ContainerSlot {
    return createContainerSlot(0, '', values);
}

export function createTombstoneSlot(timestamp: number, author: string): TombstoneSlot {
    return { s: SlotKind.Tombstone, t: timestamp, a: author };
}
