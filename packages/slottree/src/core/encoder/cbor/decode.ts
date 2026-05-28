import * as cbor from 'cbor-x';

import { decodeAuthor } from './authors';
import { binaryPayloadSchema } from './format';
import type { EncodedKey, SlotTuple } from './format';
import type { ContainerSlot, Slot } from '../../slots';
import { createSlotMap, isContainerSlot, SlotKind } from '../../slots';
import { validateSlot } from '../../slots/slot-validation';

export function decodeCbor(data: Buffer): ContainerSlot {
    const payload = binaryPayloadSchema.parse(cbor.decode(data));
    const authors = payload[0].map(decodeAuthor);
    const keys = payload[1];
    const root = tupleToSlot(payload[2], authors, keys);

    validateSlot(root);

    if (!isContainerSlot(root)) {
        throw new Error('Encoded storage root must be a container slot');
    }

    return root;
}

function tupleToSlot(tuple: SlotTuple, authors: readonly string[], keys: readonly string[]): Slot {
    const [kind, authorIndex, timestamp] = tuple;
    const author = readAuthorByIndex(authors, authorIndex);

    switch (kind) {
        case SlotKind.Atomic:
            return { s: kind, a: author, t: timestamp, v: tuple[3] };

        case SlotKind.Tombstone:
            return { s: kind, a: author, t: timestamp };

        case SlotKind.Container:
        case SlotKind.OrderedArray: {
            const children = createSlotMap();

            for (const [encodedKey, childTuple] of tuple[3]) {
                const key = decodeKey(encodedKey, keys);
                children[key] = tupleToSlot(childTuple, authors, keys);
            }

            return { s: kind, a: author, t: timestamp, v: children };
        }
    }
}

function decodeKey(key: EncodedKey, keys: readonly string[]): string {
    if (typeof key === 'string') {
        return key;
    }

    const decoded = keys[key];
    if (decoded === undefined) {
        throw new Error(`Encoded key index ${key} is out of bounds`);
    }

    return decoded;
}

function readAuthorByIndex(authors: readonly string[], index: number): string {
    const author = authors[index];
    if (author === undefined) {
        throw new Error(`Encoded author index ${index} is out of bounds`);
    }

    return author;
}
