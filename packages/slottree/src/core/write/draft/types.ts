import type { DeepReadonly, JsonValue } from '../../json';

type DraftValue<T> = Exclude<T, undefined>;
type DraftRead<T> = undefined extends T ? DeepReadonly<DraftValue<T>> | undefined : DeepReadonly<T>;
export type DraftInput<T> = DraftValue<T> extends JsonValue ? DraftValue<T> : JsonValue;

export type Draft<T> = [DraftValue<T>] extends [readonly (infer Item)[]]
    ? [Item] extends [{ __setId: string }]
        ? ArrayDraft<T>
        : never
    : [DraftValue<T>] extends [object]
      ? ObjectDraft<T>
      : AtomicDraft<T>;

export interface AtomicDraft<T> {
    get(): DraftRead<T>;
    set(value: DraftInput<T>): void;
}

type ObjectValue<T> = Extract<DraftValue<T>, object>;
type ObjectField<T extends object, K extends Extract<keyof T, string>> = string extends keyof T
    ? T[K] | undefined
    : T[K];
type DraftMap<T> = (input: Draft<T>) => Draft<T>;
type StringFields<T> = Extract<keyof ObjectValue<T>, string>;
type KnownStringFields<T extends object> = {
    [K in keyof T]: K extends string ? (string extends K ? never : K) : never;
}[keyof T];

export interface ObjectDraft<T> {
    at<K extends KnownStringFields<ObjectValue<T>>>(key: K): Draft<ObjectValue<T>[K]>;
    entry<K extends StringFields<T>>(key: K): EntryDraft<ObjectValue<T>[K]>;
    set<K extends StringFields<T>>(key: K, value: DraftInput<ObjectValue<T>[K]>): void;
    set<K extends StringFields<T>>(key: K, map: DraftMap<ObjectField<ObjectValue<T>, K>>): void;
    set(value: DraftInput<T>): void;
    delete<K extends StringFields<T>>(key: K): void;
    get(): DraftRead<T>;
    get<K extends StringFields<T>>(key: K): DraftRead<ObjectField<ObjectValue<T>, K>>;
    narrow<S extends ObjectValue<T>>(
        guard: (value: ObjectValue<T>) => value is S
    ): ObjectDraft<S> | undefined;
}

export interface EntryDraft<T> {
    exists(): boolean;
    get(): DeepReadonly<DraftValue<T>> | undefined;
    set(value: DraftInput<T>): void;
    delete(): void;
    update(map: (draft: Draft<DraftValue<T>>) => void): void;
    unwrap(): Draft<DraftValue<T>>;
    orDefault(value: DraftInput<T>): Draft<DraftValue<T>>;
}

type ArrayItem<T> = DraftValue<T> extends readonly (infer Item)[] ? Item : never;

export interface ArrayDraft<T> {
    get(): DraftRead<T>;
    set(value: DraftInput<T>): void;
    list(): readonly DeepReadonly<ArrayItem<T>>[];
    ids(): readonly string[];
    getById(id: string): DeepReadonly<ArrayItem<T>> | undefined;
    entry(id: string): EntryDraft<ArrayItem<T>>;

    push(item: DraftInput<ArrayItem<T>>): void;
    insert(index: number, item: DraftInput<ArrayItem<T>>): void;
    move(id: string, index: number): void;
    reorder(ids: readonly string[]): void;
    remove(id: string): void;
    update(id: string, map: (item: Draft<ArrayItem<T>>) => void): void;
}
