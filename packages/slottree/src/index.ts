export type {
    DeepReadonly,
    JsonArray,
    JsonObject,
    JsonPrimitive,
    JsonValue,
    Path,
    PathValue
} from './core/json';
export type {
    ArrayDraft,
    AtomicDraft,
    Draft,
    EntryDraft,
    NullableDraft,
    ObjectDraft
} from './core/write';

export { createStorage, StorageObservers } from './core/slot-tree';
export type { SlotTree, StorageImpl } from './core/slot-tree';
export type { StorageObserver } from './core/slot-tree';

export type { StorageVersion } from './core/versioning/version';
export { DEVICES_KEY, VersionController } from './core/versioning/version-controller';
export type { VersionSelector } from './core/versioning/version-controller';

export type { HNil, HCons, AssertVersionHList, NewOf } from './core/versioning/version';
export { hCons, hNil, defineVersionHList } from './core/versioning/version';
export { cloneSlot as projectIdentity } from './core/slots/slot-json';
export { zIndexedObject, zIndexedArray } from './core/schemas';
export type { ZIndexedObject, ZIndexedSerializer } from './core/schemas';
