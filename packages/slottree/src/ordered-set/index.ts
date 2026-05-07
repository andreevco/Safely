import { z } from 'zod';

import type { ProjectionBuilder, ProjectionShape } from '../core/versioning/projection';

export type OrderedSet<T> = {
    setById: Record<string, T>;
    setOrder: Record<string, number>;
};

export type ReadonlyOrderedSet<T> = {
    readonly setById: Readonly<Record<string, T>>;
    readonly setOrder: Readonly<Record<string, number>>;
};

type ProjectableRecordValue<T> = Extract<NonNullable<T>, Record<string, unknown>>;

export const orderedMap = <Schema extends z.ZodType>(value: Schema) =>
    z.object({
        setById: z.record(z.string(), value),
        setOrder: z.record(z.string(), z.number())
    });

export const orderedSet = orderedMap;

function getItemId<T>(item: T): string {
    const id = (item as { id?: unknown }).id;

    if (typeof id !== 'string') {
        throw new Error('Ordered set item must have a string id');
    }

    return id;
}

export function orderedIds<T>(set: ReadonlyOrderedSet<T>): string[] {
    return Object.entries(set.setOrder)
        .filter(([id]) => set.setById[id] !== undefined)
        .sort(([, left], [, right]) => left - right)
        .map(([id]) => id);
}

export function orderedValues<T>(set: ReadonlyOrderedSet<T>): T[] {
    return orderedIds(set).map(id => set.setById[id]);
}

function fromEntries<T>(entries: readonly (readonly [string, T])[]): OrderedSet<T> {
    const setById: Record<string, T> = {};
    const setOrder: Record<string, number> = {};

    entries.forEach(([id, item], index) => {
        setById[id] = item;
        setOrder[id] = index;
    });

    return { setById, setOrder };
}

export function emptyOrderedSet<T>(): OrderedSet<T> {
    return fromEntries<T>([]);
}

export function toOrderedSet<T>(
    items: readonly T[],
    getId: (item: T) => string = getItemId
): OrderedSet<T> {
    return fromEntries(items.map(item => [getId(item), item] as const));
}

export function insert<T>(
    set: ReadonlyOrderedSet<T>,
    item: T,
    index = orderedIds(set).length,
    getId: (item: T) => string = getItemId
): OrderedSet<T> {
    const id = getId(item);
    const withoutItem = orderedIds(set)
        .filter(existingId => existingId !== id)
        .map(existingId => [existingId, set.setById[existingId]] as const);
    const insertAt = Math.max(0, Math.min(index, withoutItem.length));

    return fromEntries([
        ...withoutItem.slice(0, insertAt),
        [id, item] as const,
        ...withoutItem.slice(insertAt)
    ]);
}

export function remove<T>(set: ReadonlyOrderedSet<T>, id: string): OrderedSet<T> {
    return fromEntries(
        orderedIds(set)
            .filter(existingId => existingId !== id)
            .map(existingId => [existingId, set.setById[existingId]] as const)
    );
}

export function reorder<T>(set: ReadonlyOrderedSet<T>, id: string, index: number): OrderedSet<T> {
    const item = getById(set, id);

    if (item === undefined) {
        return fromEntries(
            orderedIds(set).map(existingId => [existingId, set.setById[existingId]] as const)
        );
    }

    return insert<T>(remove<T>(set, id), item, index);
}

export function getById<T>(set: ReadonlyOrderedSet<T>, id: string): T | undefined {
    return set.setById[id];
}

export function hasById<T>(set: ReadonlyOrderedSet<T>, id: string): boolean {
    return getById(set, id) !== undefined;
}

function replaceWith<T>(target: OrderedSet<T>, next: OrderedSet<T>): void {
    for (const id of Object.keys(target.setById)) {
        delete target.setById[id];
    }
    for (const id of Object.keys(target.setOrder)) {
        delete target.setOrder[id];
    }

    for (const [id, item] of Object.entries(next.setById)) {
        target.setById[id] = item;
    }
    for (const [id, index] of Object.entries(next.setOrder)) {
        target.setOrder[id] = index;
    }
}

export function insertById<T>(
    set: OrderedSet<T>,
    item: T,
    index = orderedIds(set).length,
    getId: (item: T) => string = getItemId
): void {
    replaceWith(set, insert(set, item, index, getId));
}

export function removeById<T>(set: OrderedSet<T>, id: string): void {
    replaceWith(set, remove(set, id));
}

export function reorderById<T>(set: OrderedSet<T>, id: string, index: number): void {
    replaceWith(set, reorder(set, id, index));
}

export function setOrderedIds<T>(set: OrderedSet<T>, ids: readonly string[]): void {
    const orderedExistingIds = new Set(ids.filter(id => getById(set, id) !== undefined));
    const entries = [
        ...ids
            .filter(id => getById(set, id) !== undefined)
            .map(id => [id, getById(set, id)] as const),
        ...orderedIds(set)
            .filter(id => !orderedExistingIds.has(id))
            .map(id => [id, getById(set, id)] as const)
    ].filter((entry): entry is readonly [string, T] => entry[1] !== undefined);

    replaceWith(set, fromEntries(entries));
}

export function sortOrderedSet<T>(
    set: OrderedSet<T>,
    compare: (left: T, right: T) => number
): void {
    replaceWith(
        set,
        fromEntries(Object.entries(set.setById).sort(([, left], [, right]) => compare(left, right)))
    );
}

// Contract: order indexes are copied unchanged; only setById item shape changes.
export function projectOrderedSet<
    FromValue extends Record<string, unknown>,
    ToValue extends Record<string, unknown>
>(
    set: ProjectionBuilder<OrderedSet<FromValue>>,
    buildValue: (
        itemId: string,
        value: ProjectionBuilder<ProjectableRecordValue<FromValue>>
    ) => ProjectionShape<ProjectableRecordValue<FromValue>, ToValue>
): ProjectionShape<OrderedSet<FromValue>, OrderedSet<ToValue>> {
    return {
        setById: set.recordFrom<'setById', ToValue>('setById', buildValue),
        setOrder: set.copy()
    } as ProjectionShape<OrderedSet<FromValue>, OrderedSet<ToValue>>;
}
