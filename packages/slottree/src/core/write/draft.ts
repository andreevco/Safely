import type { DeepReadonly, JsonValue } from '../json';
import type { Slot } from '../slots';
import { JsonStorageSelection } from './selection';
import { cloneDeep, stripSlot } from '../slots/slot-json';

type JsonLeaf = string | number | boolean | null | JsonValue[];
type DraftValue<T> = Exclude<T, undefined>;
type DraftInput<T> = DraftValue<T> extends JsonValue ? DraftValue<T> : JsonValue;
type DraftMap<T> = (input: Draft<T>) => Draft<T>;
type RuntimeDraftMap = (input: JsonDraftNode) => JsonDraftNode;

export type Draft<T> =
    DraftValue<T> extends JsonLeaf
        ? AtomicDraft<T>
        : DraftValue<T> extends object
          ? ObjectDraft<DraftValue<T>>
          : AtomicDraft<T>;

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

type SlotReader = () => Slot | undefined;
type ExistingSelectionReader = () => JsonStorageSelection | undefined;
type ContainerEnsurer = () => JsonStorageSelection;

export function createDraft<T>(selection: JsonStorageSelection, onUpdate: () => void): Draft<T> {
    return new JsonDraftNode(
        () => selection.containerSlot(),
        () => selection,
        () => selection,
        onUpdate
    ) as unknown as Draft<T>;
}

class JsonDraftNode {
    constructor(
        private readonly readSlot: SlotReader,
        private readonly readExistingSelection: ExistingSelectionReader,
        private readonly ensureContainer: ContainerEnsurer,
        private readonly onUpdate: () => void
    ) {}

    public at(key: string): JsonDraftNode {
        return new JsonDraftNode(
            () => this.readExistingSelection()?.get(key),
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
}
