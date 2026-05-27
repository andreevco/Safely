import * as cbor from 'cbor-x';

import { collectEncodingTables, encodeAuthor } from './authors';
import type { BinaryPayload, EncodedKey, SlotTuple } from './format';
import type { ContainerSlot, Slot } from '../../slots';
import { SlotKind } from '../../slots';

export function encodeCbor(root: ContainerSlot): Buffer {
    const tables = collectEncodingTables(root);
    return cbor.encode([
        tables.authors.map(encodeAuthor),
        tables.keys,
        slotToTuple(root, tables.authorIndexes, tables.keyIndexes)
    ] satisfies BinaryPayload);
}

function slotToTuple(
    slot: Slot,
    authorIndexes: ReadonlyMap<string, number>,
    keyIndexes: ReadonlyMap<string, number>
): SlotTuple {
    const authorIndex = authorIndexes.get(slot.a);
    if (authorIndex === undefined) {
        throw new Error(`Slot author "${slot.a}" is missing from binary author table`);
    }

    switch (slot.s) {
        case SlotKind.Atomic:
            return [slot.s, authorIndex, slot.t, slot.v];

        case SlotKind.Tombstone:
            return [slot.s, authorIndex, slot.t];

        case SlotKind.Container:
        case SlotKind.OrderedArray: {
            const entries = sortedEntries(slot).map(([key, child]): [EncodedKey, SlotTuple] => {
                return [encodeKey(key, keyIndexes), slotToTuple(child, authorIndexes, keyIndexes)];
            });

            return [slot.s, authorIndex, slot.t, entries] as SlotTuple;
        }
    }
}

function sortedEntries(
    slot: Extract<Slot, { v: Record<string, Slot | undefined> }>
): [string, Slot][] {
    return Object.entries(slot.v)
        .filter((entry): entry is [string, Slot] => entry[1] !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
}

function encodeKey(key: string, keyIndexes: ReadonlyMap<string, number>): EncodedKey {
    return keyIndexes.get(key) ?? key;
}
