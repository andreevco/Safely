import type { JsonValue } from '../json';
import type { ContainerSlot, Slot } from '../slots';
import {
    createContainerSlot,
    createTombstoneSlot,
    isContainerSlot,
    isTombstoneSlot
} from '../slots';
import { slotFromJson } from '../slots/slot-json';

export class JsonStorageSelection {
    constructor(
        private readonly container: ContainerSlot,
        private readonly timestamp: number,
        private readonly author: string
    ) {}

    public containerSlot(): ContainerSlot {
        return this.container;
    }

    public currentTimestamp(): number {
        return this.timestamp;
    }

    public currentAuthor(): string {
        return this.author;
    }

    public get(prop: string): Slot | undefined {
        return this.container.v[prop];
    }

    public keys(): string[] {
        return Object.keys(this.container.v).filter(key => {
            const slot = this.container.v[key];

            return slot !== undefined && !isTombstoneSlot(slot);
        });
    }

    public has(prop: string): boolean {
        const slot = this.container.v[prop];

        return slot !== undefined && !isTombstoneSlot(slot);
    }

    public select(prop: string): JsonStorageSelection | undefined {
        const child = this.container.v[prop];

        if (!isContainerSlot(child)) {
            return undefined;
        }

        return new JsonStorageSelection(child, this.timestamp, this.author);
    }

    public set(prop: string, value: JsonValue): void {
        this.container.v[prop] = slotFromJson(value, this.timestamp, this.author);
    }

    public setSlot(prop: string, slot: Slot): void {
        this.container.v[prop] = slot;
    }

    public delete(prop: string): void {
        this.container.v[prop] = createTombstoneSlot(this.timestamp, this.author);
    }

    public selectOrCreate(prop: string): JsonStorageSelection {
        const child = this.container.v[prop];

        if (!isContainerSlot(child)) {
            this.container.v[prop] = createContainerSlot(this.timestamp, this.author);
        }

        return new JsonStorageSelection(
            this.container.v[prop] as ContainerSlot,
            this.timestamp,
            this.author
        );
    }
}

export function selectJsonStorage(
    container: ContainerSlot,
    timestamp: number,
    author: string
): JsonStorageSelection {
    return new JsonStorageSelection(container, timestamp, author);
}
