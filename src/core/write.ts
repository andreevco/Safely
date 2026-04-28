import {
  ContainerSlot,
  createContainerSlot,
  createTombstoneSlot,
  isContainerSlot,
  Slot,
  slotFromJson,
} from "./slots";
import { JsonValue } from "./json";

export class JsonStorageSelection {
  constructor(
    private readonly container: ContainerSlot,
    private readonly timestamp: number,
    private readonly author: string,
  ) {}

  get(prop: string): Slot | undefined {
    return this.container.v[prop];
  }

  select(prop: string): JsonStorageSelection | undefined {
    const child = this.container.v[prop];

    if (!isContainerSlot(child)) {
      return undefined;
    }

    return new JsonStorageSelection(child, this.timestamp, this.author);
  }

  set(prop: string, value: JsonValue): void {
    this.container.v[prop] = slotFromJson(value, this.timestamp, this.author);
  }

  delete(prop: string): void {
    this.container.v[prop] = createTombstoneSlot(this.timestamp, this.author);
  }

  selectOrCreate(prop: string): JsonStorageSelection {
    const child = this.container.v[prop];

    if (!isContainerSlot(child)) {
      this.container.v[prop] = createContainerSlot(this.timestamp, this.author);
    }

    return new JsonStorageSelection(
      this.container.v[prop] as ContainerSlot,
      this.timestamp,
      this.author,
    );
  }
}

export function selectJsonStorage(
  container: ContainerSlot,
  timestamp: number,
  author: string,
): JsonStorageSelection {
  return new JsonStorageSelection(container, timestamp, author);
}

function selectParentJsonStorage(
  container: ContainerSlot,
  path: string[],
  timestamp: number,
  author: string,
): { selection: JsonStorageSelection; prop: string } {
  if (path.length === 0) {
    throw new Error("Cannot select parent for root path");
  }

  let selection = selectJsonStorage(container, timestamp, author);
  for (let index = 0; index < path.length - 1; index += 1) {
    selection = selection.selectOrCreate(path[index]);
  }

  return { selection, prop: path[path.length - 1] };
}

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

  const { selection, prop } = selectParentJsonStorage(
    container,
    path,
    timestamp,
    author,
  );
  selection.set(prop, value);
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

  const { selection, prop } = selectParentJsonStorage(
    container,
    path,
    timestamp,
    author,
  );
  selection.delete(prop);
}
