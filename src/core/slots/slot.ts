import type { JsonObject, JsonValue } from "../json";

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
