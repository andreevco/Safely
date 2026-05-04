import { z } from "zod";
import type {
  ProjectionBuilder,
  ProjectionShape,
} from "../core/versioning/projection";

export type OrderedSet<T> = {
  setById: Record<string, T>;
  setOrder: Record<string, number>;
};

export type ReadonlyOrderedSet<T> = {
  readonly setById: Readonly<Record<string, T>>;
  readonly setOrder: Readonly<Record<string, number>>;
};

type ProjectableRecordValue<T> = Extract<
  NonNullable<T>,
  Record<string, unknown>
>;

export const orderedMap = <Schema extends z.ZodType>(value: Schema) =>
  z.object({
    setById: z.record(z.string(), value),
    setOrder: z.record(z.string(), z.number()),
  });

export const orderedSet = orderedMap;

function getItemId<T>(item: T): string {
  const id = (item as { id?: unknown }).id;

  if (typeof id !== "string") {
    throw new Error("Ordered set item must have a string id");
  }

  return id;
}

export function orderedIds<T>(set: ReadonlyOrderedSet<T>): string[] {
  return Object.entries(set.setOrder)
    .filter(([id]) => set.setById[id] !== undefined)
    .sort(([, left], [, right]) => left - right)
    .map(([id]) => id);
}

function fromEntries<T>(
  entries: readonly (readonly [string, T])[],
): OrderedSet<T> {
  const setById: Record<string, T> = {};
  const setOrder: Record<string, number> = {};

  entries.forEach(([id, item], index) => {
    setById[id] = item;
    setOrder[id] = index;
  });

  return { setById, setOrder };
}

export function toOrderedSet<T>(
  items: readonly T[],
  getId: (item: T) => string = getItemId,
): OrderedSet<T> {
  return fromEntries(items.map((item) => [getId(item), item] as const));
}

export function insert<T>(
  set: ReadonlyOrderedSet<T>,
  item: T,
  index = orderedIds(set).length,
  getId: (item: T) => string = getItemId,
): OrderedSet<T> {
  const id = getId(item);
  const withoutItem = orderedIds(set)
    .filter((existingId) => existingId !== id)
    .map((existingId) => [existingId, set.setById[existingId]] as const);
  const insertAt = Math.max(0, Math.min(index, withoutItem.length));

  return fromEntries([
    ...withoutItem.slice(0, insertAt),
    [id, item] as const,
    ...withoutItem.slice(insertAt),
  ]);
}

export function remove<T>(
  set: ReadonlyOrderedSet<T>,
  id: string,
): OrderedSet<T> {
  return fromEntries(
    orderedIds(set)
      .filter((existingId) => existingId !== id)
      .map((existingId) => [existingId, set.setById[existingId]] as const),
  );
}

export function reorder<T>(
  set: ReadonlyOrderedSet<T>,
  id: string,
  index: number,
): OrderedSet<T> {
  const item = getById(set, id);

  if (item === undefined) {
    return fromEntries(
      orderedIds(set).map(
        (existingId) => [existingId, set.setById[existingId]] as const,
      ),
    );
  }

  return insert<T>(remove<T>(set, id), item, index);
}

export function getById<T>(
  set: ReadonlyOrderedSet<T>,
  id: string,
): T | undefined {
  return set.setById[id];
}

// Contract: order indexes are copied unchanged; only setById item shape changes.
export function projectOrderedSet<
  FromValue extends Record<string, unknown>,
  ToValue extends Record<string, unknown>,
>(
  set: ProjectionBuilder<OrderedSet<FromValue>>,
  buildValue: (
    itemId: string,
    value: ProjectionBuilder<ProjectableRecordValue<FromValue>>,
  ) => ProjectionShape<ProjectableRecordValue<FromValue>, ToValue>,
): ProjectionShape<OrderedSet<FromValue>, OrderedSet<ToValue>> {
  return {
    setById: set.recordFrom<"setById", ToValue>("setById", buildValue),
    setOrder: set.copy(),
  } as ProjectionShape<OrderedSet<FromValue>, OrderedSet<ToValue>>;
}
