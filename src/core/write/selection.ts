import { JsonValue } from "../json";
import {
  ContainerSlot,
  createContainerSlot,
  createTombstoneSlot,
  isContainerSlot,
  Slot,
} from "../slots";
import { slotFromJson } from "../slots/slot-json";

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
