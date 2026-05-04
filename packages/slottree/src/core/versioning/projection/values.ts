import type { DeepReadonly } from "../../json";
import {
  createTombstoneSlot,
  isContainerSlot,
  type Slot,
} from "../../slots";
import { slotFromJson } from "../../slots/slot-json";
import { createReadProxy, selectJsonStorage } from "../../write";
import { createClockTracker, maxClockInTree, type SlotClock } from "./clock";
import type { ProjectionMap, ProjectionValue } from "./types";

export function applyMap(
  sourceSlot: Slot | undefined,
  map: ProjectionMap<unknown, ProjectionValue>,
): Slot {
  const clockTracker = createClockTracker();
  const value = readValueFromSlot(sourceSlot, clockTracker.observe);

  const mapped = map(value as DeepReadonly<unknown>);

  const clock = clockTracker.result() ??
    maxClockInTree(sourceSlot) ?? { t: 0, a: "" };

  return projectionValueToSlot(mapped, clock);
}

export function resolveDefaultValue<Output extends ProjectionValue>(
  value: Output | (() => Output),
): Output {
  if (typeof value === "function") {
    return (value as () => Output)();
  }

  return value;
}

export function projectionValueToSlot(
  value: ProjectionValue,
  clock: SlotClock,
): Slot {
  if (value === undefined) {
    return createTombstoneSlot(clock.t, clock.a);
  }

  return slotFromJson(value, clock.t, clock.a);
}

function readValueFromSlot(
  slot: Slot | undefined,
  onRead: (slot: Slot) => void,
): unknown {
  if (slot === undefined || slot.d === true) {
    return undefined;
  }

  if (isContainerSlot(slot)) {
    return createReadProxy(selectJsonStorage(slot, 0, ""), onRead);
  }

  onRead(slot);
  return cloneJson(slot.v);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
