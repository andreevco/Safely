import type { JsonValue } from '../json';
import { SlotKind, type Slot } from './slot';

export function validateSlot(slot: unknown): asserts slot is Slot {
    validateSlotInner(slot, 0);
}

function validateSlotInner(slot: unknown, depth: number): void {
    if (slot === null || typeof slot !== 'object') {
        throw new Error('Slot must be an object');
    }

    const record = slot as Record<string, unknown>;
    if (typeof record.t !== 'number' || !Number.isFinite(record.t)) {
        throw new Error('Slot timestamp must be a finite number');
    }
    if (typeof record.a !== 'string') {
        throw new Error('Slot author must be a string');
    }

    if (
        record.s !== SlotKind.Atomic &&
        record.s !== SlotKind.Container &&
        record.s !== SlotKind.Tombstone
    ) {
        throw new Error('Slot kind must be a known numeric discriminant');
    }

    if (record.s === SlotKind.Container) {
        if (record.v === null || typeof record.v !== 'object') {
            throw new Error('Container slot value must be an object');
        }

        for (const key of Object.keys(record.v)) {
            const child = (record.v as Record<string, unknown>)[key];
            if (child !== undefined) {
                validateSlotInner(child, depth + 1);
            }
        }
        return;
    }

    if (record.s === SlotKind.Tombstone) {
        return;
    }

    if (!isJsonValue(record.v, depth + 1)) {
        throw new Error('Atomic slot value must be JSON-compatible');
    }
}

function isJsonValue(value: unknown, depth: number): value is JsonValue {
    if (depth > 1000) {
        throw new Error('JSON value is too deep');
    }

    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return typeof value !== 'number' || Number.isFinite(value);
    }

    if (Array.isArray(value)) {
        return value.every(item => isJsonValue(item, depth + 1));
    }

    if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
            if (!isJsonValue((value as Record<string, unknown>)[key], depth + 1)) {
                return false;
            }
        }

        return true;
    }

    return false;
}
