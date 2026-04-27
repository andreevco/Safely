import type { JsonObject, JsonValue } from "./json";

export interface AtomicSlot {
  v: JsonValue;
  t: number;
  a: string;
  r?: false;
  d?: false;
}

export interface TombstoneSlot {
  d: true;
  t: number;
  a: string;
  r?: false;
}

export interface ContainerSlot {
  v: SlotMap;
  t: number;
  a: string;
  r: true;
  d?: false;
}

export type Slot = AtomicSlot | TombstoneSlot | ContainerSlot;
export type SlotMap = { [key: string]: Slot | undefined };

export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isJsonObject(
  value: JsonValue | undefined,
): value is JsonObject {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function isContainerSlot(slot: Slot | undefined): slot is ContainerSlot {
  return slot !== undefined && slot.r === true;
}

export function createContainerSlot(
  timestamp: number,
  author: string,
  values: SlotMap = {},
): ContainerSlot {
  return { v: values, t: timestamp, a: author, r: true };
}

export function createOriginContainer(values: SlotMap = {}): ContainerSlot {
  return createContainerSlot(0, "", values);
}

export function createTombstoneSlot(
  timestamp: number,
  author: string,
): TombstoneSlot {
  return { d: true, t: timestamp, a: author };
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

  const out: JsonObject = {};
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
  value: JsonValue,
  timestamp: number,
  author: string,
): Slot {
  if (isJsonObject(value)) {
    const values: SlotMap = {};

    for (const key of Object.keys(value)) {
      values[key] = slotFromJson(value[key], timestamp, author);
    }

    return createContainerSlot(timestamp, author, values);
  }

  return {
    v: cloneDeep(value),
    t: timestamp,
    a: author,
  };
}

export function validateSlot(slot: unknown): asserts slot is Slot {
  validateSlotInner(slot, 0);
}

function validateSlotInner(slot: unknown, depth: number): void {
  if (slot === null || typeof slot !== "object") {
    throw new Error("Slot must be an object");
  }

  const record = slot as Record<string, unknown>;
  if (typeof record.t !== "number" || !Number.isFinite(record.t)) {
    throw new Error("Slot timestamp must be a finite number");
  }
  if (typeof record.a !== "string") {
    throw new Error("Slot author must be a string");
  }

  if (record.r === true) {
    if (record.d === true) {
      throw new Error("Container slot cannot also be a tombstone");
    }
    if (record.v === null || typeof record.v !== "object") {
      throw new Error("Container slot value must be an object");
    }

    for (const key of Object.keys(record.v)) {
      const child = (record.v as Record<string, unknown>)[key];
      if (child !== undefined) {
        validateSlotInner(child, depth + 1);
      }
    }
    return;
  }

  if (record.d === true) {
    return;
  }

  if (!isJsonValue(record.v, depth + 1)) {
    throw new Error("Atomic slot value must be JSON-compatible");
  }
}

function isJsonValue(value: unknown, depth: number): value is JsonValue {
  if (depth > 1000) {
    throw new Error("JSON value is too deep");
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value !== "number" || Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, depth + 1));
  }

  if (typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (!isJsonValue((value as Record<string, unknown>)[key], depth + 1)) {
        return false;
      }
    }

    return true;
  }

  return false;
}
