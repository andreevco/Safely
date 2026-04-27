import {
  ContainerSlot,
  createContainerSlot,
  createTombstoneSlot,
  isContainerSlot,
  slotFromJson,
} from "./slots";
import { JsonValue } from "./json";

export function setJsonAtPath(
  container: ContainerSlot,
  path: string[],
  value: JsonValue,
  timestamp: number,
  author: string,
): void {
  if (path.length === 0) {
    throw new Error("Cannot replace root through setJsonAtPath");
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    container.v[head] = slotFromJson(value, timestamp, author);
    return;
  }

  const child = container.v[head];

  if (!isContainerSlot(child)) {
    container.v[head] = createContainerSlot(timestamp, author);
  }

  setJsonAtPath(
    container.v[head] as ContainerSlot,
    tail,
    value,
    timestamp,
    author,
  );
}

export function deleteJsonAtPath(
  container: ContainerSlot,
  path: string[],
  timestamp: number,
  author: string,
): void {
  if (path.length === 0) {
    throw new Error("Cannot delete root through deleteJsonAtPath");
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    container.v[head] = createTombstoneSlot(timestamp, author);
    return;
  }

  const child = container.v[head];

  if (!isContainerSlot(child)) {
    container.v[head] = createContainerSlot(timestamp, author);
  }

  deleteJsonAtPath(container.v[head] as ContainerSlot, tail, timestamp, author);
}
