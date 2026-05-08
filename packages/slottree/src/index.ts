export type {
    DeepReadonly,
    JsonArray,
    JsonObject,
    JsonPrimitive,
    JsonValue,
    Path,
    PathValue
} from './core/json';
export type { ArrayDraft, AtomicDraft, Draft, ObjectDraft } from './core/write';

export { createStorage, StorageObservers } from './core/storage';
export type { Storage, StorageImpl } from './core/storage';
export type { StorageObserver } from './core/storage';
export {
    getById,
    insert,
    orderedIds,
    orderedMap,
    orderedSet,
    projectOrderedSet,
    remove,
    reorder,
    toOrderedSet
} from './ordered-set';
export type { OrderedSet, ReadonlyOrderedSet } from './ordered-set';

export type { StorageVersion } from './core/versioning/version';
export { DEVICES_KEY, VersionController } from './core/versioning/version-controller';
export type { VersionSelector } from './core/versioning/version-controller';

export type { HNil, HCons, AssertVersionHList, NewOf } from './core/versioning/version';
export { hCons, hNil, defineVersionHList } from './core/versioning/version';
export { cloneSlot as projectIdentity } from '../src/core/slots/slot-json';
