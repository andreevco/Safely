import type { DeepReadonly, JsonValue } from '../json';
import {
    createOrderedArraySlot,
    createOriginOrderedArray,
    createTombstoneSlot,
    isOrderedArraySlot,
    isTombstoneSlot,
    SlotKind,
    type ContainerSlot,
    type OrderedArraySlot,
    type Slot
} from '../slots';
import { JsonStorageSelection } from './selection';
import {
    cloneDeep,
    createOrderedArrayItemSlot,
    orderedArrayItemValue,
    orderedArrayLiveIds,
    stripSlot,
    slotFromJson
} from '../slots/slot-json';

type JsonLeaf = string | number | boolean | null;
type DraftValue<T> = Exclude<T, undefined>;
export type DraftInput<T> = DraftValue<T> extends JsonValue ? DraftValue<T> : JsonValue;
type DraftMap<T> = (input: Draft<T>) => Draft<T>;
type RuntimeDraftMap = (input: JsonDraftNode) => JsonDraftNode;

export type Draft<T> =
    DraftValue<T> extends readonly (infer Item)[]
        ? Item extends { id: string }
            ? ArrayDraft<Item>
            : never
        : DraftValue<T> extends JsonLeaf
          ? AtomicDraft<T>
          : DraftValue<T> extends object
            ? ObjectDraft<DraftValue<T>>
            : never;

export interface AtomicDraft<T> {
    get(): DeepReadonly<T> | undefined;
}

export interface ObjectDraft<T extends object> {
    at<K extends Extract<keyof T, string>>(key: K): Draft<T[K]>;
    set<K extends Extract<keyof T, string>>(key: K, value: DraftInput<T[K]>): void;
    set<K extends Extract<keyof T, string>>(key: K, map: DraftMap<T[K]>): void;
    delete<K extends Extract<keyof T, string>>(key: K): void;
    get(): DeepReadonly<T> | undefined;
}

export interface ArrayDraft<T extends { id: string }> {
    get(): readonly DeepReadonly<T>[] | undefined;
    list(): readonly DeepReadonly<T>[];
    ids(): readonly string[];
    byId(id: string): DeepReadonly<T> | undefined;

    push(item: DraftInput<T>): void;
    insert(index: number, item: DraftInput<T>): void;
    move(id: string, index: number): void;
    remove(id: string): void;
    replace(id: string, item: DraftInput<T>): void;
    update(id: string, map: (item: DeepReadonly<T>) => DraftInput<T>): void;
}

type SlotReader = () => Slot | undefined;
type SlotWriter = (slot: Slot) => void;
type SelfDeleter = () => void;
type ExistingSelectionReader = () => JsonStorageSelection | undefined;
type ContainerEnsurer = () => JsonStorageSelection;

export function createDraft<T>(selection: JsonStorageSelection, onUpdate: () => void): Draft<T> {
    return new JsonDraftNode(
        () => selection.containerSlot(),
        undefined,
        undefined,
        selection.currentTimestamp(),
        selection.currentAuthor(),
        () => selection,
        () => selection,
        onUpdate
    ) as unknown as Draft<T>;
}

class JsonDraftNode {
    constructor(
        private readonly readSlot: SlotReader,
        private readonly writeSlot: SlotWriter | undefined,
        private readonly deleteSelf: SelfDeleter | undefined,
        private readonly timestampValue: number,
        private readonly authorValue: string,
        private readonly readExistingSelection: ExistingSelectionReader,
        private readonly ensureContainer: ContainerEnsurer,
        private readonly onUpdate: () => void
    ) {}

    public at(key: string): JsonDraftNode {
        return new JsonDraftNode(
            () => this.readExistingSelection()?.get(key),
            slot => this.ensureContainer().setSlot(key, slot),
            () => this.ensureContainer().delete(key),
            this.timestampValue,
            this.authorValue,
            () => this.readExistingSelection()?.select(key),
            () => this.ensureContainer().selectOrCreate(key),
            this.onUpdate
        );
    }

    public set(key: string, value: JsonValue | RuntimeDraftMap): void {
        if (typeof value === 'function') {
            const mapped = value(this.at(key)).get();

            if (mapped === undefined) {
                this.ensureContainer().delete(key);
            } else {
                this.ensureContainer().set(key, mapped as JsonValue);
            }
        } else {
            this.ensureContainer().set(key, value);
        }
        this.onUpdate();
    }

    public delete(key: string): void {
        this.ensureContainer().delete(key);
        this.onUpdate();
    }

    public get(): unknown {
        return cloneDeep(stripSlot(this.readSlot()));
    }

    public list(): readonly unknown[] {
        const value = this.get();

        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new Error('Draft value is not an ordered array');
        }

        return value;
    }

    public ids(): readonly string[] {
        const slot = this.readSlot();

        if (slot === undefined || isTombstoneSlot(slot)) {
            return [];
        }

        if (!isOrderedArraySlot(slot)) {
            throw new Error('Draft value is not an ordered array slot');
        }

        return orderedArrayLiveIds(slot);
    }

    public byId(id: string): unknown {
        const slot = this.readSlot();

        if (slot === undefined || isTombstoneSlot(slot)) {
            return undefined;
        }

        if (!isOrderedArraySlot(slot)) {
            throw new Error('Draft value is not an ordered array slot');
        }

        const item = slot.v[id];
        if (item === undefined || isTombstoneSlot(item)) {
            return undefined;
        }

        return cloneDeep(stripSlot(orderedArrayItemValue(item, id)));
    }

    public push(item: JsonValue): void {
        const arraySlot = this.ensureOrderedArraySlot();
        const id = this.validateArrayDraftItem(item);

        if (this.hasLiveArrayItem(arraySlot, id)) {
            throw new Error(`Ordered array item "${id}" already exists`);
        }

        const nextOrder = this.maxLiveOrder(arraySlot) + 1;
        arraySlot.v[id] = createOrderedArrayItemSlot(
            nextOrder < 0 ? 0 : nextOrder,
            item,
            this.timestamp(),
            this.author()
        );
        this.onUpdate();
    }

    public insert(index: number, item: JsonValue): void {
        const arraySlot = this.ensureOrderedArraySlot();
        const id = this.validateArrayDraftItem(item);

        if (this.hasLiveArrayItem(arraySlot, id)) {
            throw new Error(`Ordered array item "${id}" already exists`);
        }

        arraySlot.v[id] = createOrderedArrayItemSlot(index, item, this.timestamp(), this.author());

        const ids = orderedArrayLiveIds(arraySlot).filter(candidate => candidate !== id);
        ids.splice(this.clampIndex(index, ids.length + 1), 0, id);
        this.rebuildDenseOrder(arraySlot, ids);
        this.onUpdate();
    }

    public move(id: string, index: number): void {
        const arraySlot = this.expectOrderedArraySlot();
        if (!this.hasLiveArrayItem(arraySlot, id)) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        const ids = orderedArrayLiveIds(arraySlot).filter(candidate => candidate !== id);
        ids.splice(this.clampIndex(index, ids.length + 1), 0, id);
        this.rebuildDenseOrder(arraySlot, ids);
        this.onUpdate();
    }

    public remove(id: string): void {
        const arraySlot = this.expectOrderedArraySlot();
        if (!this.hasLiveArrayItem(arraySlot, id)) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        arraySlot.v[id] = createTombstoneSlot(this.timestamp(), this.author());
        this.onUpdate();
    }

    public replace(id: string, item: JsonValue): void {
        const arraySlot = this.expectOrderedArraySlot();
        const itemId = this.validateArrayDraftItem(item);
        if (itemId !== id) {
            throw new Error(`Replacement item id "${itemId}" must match "${id}"`);
        }

        const itemSlot = this.expectLiveArrayItem(arraySlot, id);
        itemSlot.v.value = slotFromJson(item, this.timestamp(), this.author());
        this.onUpdate();
    }

    public update(id: string, map: (item: unknown) => JsonValue): void {
        const current = this.byId(id);
        if (current === undefined) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        this.replace(id, map(current));
    }

    private ensureOrderedArraySlot(): OrderedArraySlot {
        const slot = this.readSlot();

        if (isOrderedArraySlot(slot)) {
            return slot;
        }

        if (slot === undefined) {
            return this.writeNewOrderedArraySlot(createOriginOrderedArray());
        }

        if (isTombstoneSlot(slot)) {
            return this.writeNewOrderedArraySlot(
                createOrderedArraySlot(this.timestamp(), this.author())
            );
        }

        throw new Error('Draft value cannot be converted to an ordered array slot');
    }

    private expectOrderedArraySlot(): OrderedArraySlot {
        const slot = this.readSlot();

        if (!isOrderedArraySlot(slot)) {
            throw new Error('Draft value is not an ordered array slot');
        }

        return slot;
    }

    private writeNewOrderedArraySlot(slot: OrderedArraySlot): OrderedArraySlot {
        if (this.writeSlot === undefined) {
            throw new Error('Cannot replace the root draft slot');
        }

        this.writeSlot(slot);
        return slot;
    }

    private validateArrayDraftItem(item: JsonValue): string {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
            throw new Error('Ordered array draft item must be an object');
        }

        const id = item.id;
        if (typeof id !== 'string') {
            throw new Error('Ordered array draft item must have a string id');
        }

        return id;
    }

    private hasLiveArrayItem(slot: OrderedArraySlot, id: string): boolean {
        const item = slot.v[id];

        return item !== undefined && !isTombstoneSlot(item);
    }

    private expectLiveArrayItem(slot: OrderedArraySlot, id: string): ContainerSlot {
        const item = slot.v[id];
        if (item === undefined || isTombstoneSlot(item)) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        if (item.s !== SlotKind.Container) {
            throw new Error(`Ordered array item "${id}" must be a container slot`);
        }

        return item;
    }

    private maxLiveOrder(slot: OrderedArraySlot): number {
        return orderedArrayLiveIds(slot).reduce((max, id) => {
            const item = slot.v[id];
            if (item === undefined) {
                return max;
            }

            const orderSlot =
                item.s === SlotKind.Container && item.v.order?.s === SlotKind.Atomic
                    ? item.v.order
                    : undefined;

            return typeof orderSlot?.v === 'number' ? Math.max(max, orderSlot.v) : max;
        }, -1);
    }

    private rebuildDenseOrder(slot: OrderedArraySlot, ids: readonly string[]): void {
        ids.forEach((id, order) => {
            const item = this.expectLiveArrayItem(slot, id);
            item.v.order = {
                s: SlotKind.Atomic,
                v: order,
                t: this.timestamp(),
                a: this.author()
            };
        });
    }

    private clampIndex(index: number, length: number): number {
        if (!Number.isInteger(index)) {
            throw new Error('Ordered array index must be an integer');
        }

        return Math.max(0, Math.min(index, length));
    }

    private timestamp(): number {
        return this.timestampValue;
    }

    private author(): string {
        return this.authorValue;
    }
}
