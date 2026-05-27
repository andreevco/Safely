import type { EncodedAuthor } from './format';
import type { Slot } from '../../slots';
import { SlotKind } from '../../slots';

export function collectEncodingTables(root: Slot): {
    authors: string[];
    authorIndexes: ReadonlyMap<string, number>;
    keys: string[];
    keyIndexes: ReadonlyMap<string, number>;
} {
    const authors = new Set<string>();
    const keys = new Map<string, number>();

    const visit = (slot: Slot): void => {
        if (!authors.has(slot.a)) {
            authors.add(slot.a);
        }

        if (slot.s !== SlotKind.Container && slot.s !== SlotKind.OrderedArray) {
            return;
        }

        for (const [key, child] of sortedEntries(slot)) {
            const count = keys.get(key) ?? 0;
            keys.set(key, count + 1);
            visit(child);
        }
    };

    visit(root);
    const compactKeys = selectCompactKeys(keys);

    return {
        authors: [...authors.values()],
        authorIndexes: createAuthorIndex([...authors.values()]),
        keys: compactKeys,
        keyIndexes: createKeyIndex(compactKeys)
    };
}

export function encodeAuthor(author: string): EncodedAuthor {
    if (!isHex(author)) {
        throw new Error('Author must be hex');
    }
    return Buffer.from(author, 'hex');
}

export function decodeAuthor(author: EncodedAuthor): string {
    return typeof author === 'string' ? author : Buffer.from(author).toString('hex');
}

export function createAuthorIndex(authors: readonly string[]): ReadonlyMap<string, number> {
    return new Map(authors.map((author, index) => [author, index]));
}

function createKeyIndex(keys: readonly string[]): ReadonlyMap<string, number> {
    return new Map(keys.map((key, index) => [key, index]));
}

function selectCompactKeys(keys: ReadonlyMap<string, number>): string[] {
    const compactKeys: string[] = [];

    for (const [key, count] of keys) {
        if (key.length >= 3 && count >= 2) {
            compactKeys.push(key);
        }
    }

    return compactKeys;
}

function sortedEntries(
    slot: Extract<Slot, { v: Record<string, Slot | undefined> }>
): [string, Slot][] {
    return Object.entries(slot.v)
        .filter((entry): entry is [string, Slot] => entry[1] !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
}

function isHex(value: string): boolean {
    return value.length % 2 === 0 && /^[\da-f]*$/i.test(value);
}
