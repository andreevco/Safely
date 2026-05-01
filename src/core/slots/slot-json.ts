import {
  createNullPrototypeRecord,
  type JsonObject,
  type JsonValue,
} from "../json";
import {
  createContainerSlot,
  createSlotMap,
  createTombstoneSlot,
  isJsonObject,
  type Slot,
  type SlotMap,
} from "./slot";

export function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item === undefined ? null : cloneDeep(item),
    ) as T;
  }

  if (value !== null && typeof value === "object") {
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

  if (slot.d === true) {
    return undefined;
  }

  if (slot.r !== true) {
    return slot.v;
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

export function slotFromJson(
  value: JsonValue | undefined,
  timestamp: number,
  author: string,
): Slot {
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
    v: cloneDeep(value),
    t: timestamp,
    a: author,
  };
}
