import type { DeepReadonly, JsonValue } from '../../json';

type JsonLeaf = string | number | boolean | null;
type DraftValue<T> = Exclude<T, undefined>;
export type DraftInput<T> = DraftValue<T> extends JsonValue ? DraftValue<T> : JsonValue;
type DraftMap<T> = (input: Draft<T>) => Draft<T>;

export type Draft<T> =
    DraftValue<T> extends readonly (infer Item)[]
        ? Item extends { __setId: string }
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

export interface ArrayDraft<T extends { __setId: string }> {
    get(): readonly DeepReadonly<T>[] | undefined;
    list(): readonly DeepReadonly<T>[];
    ids(): readonly string[];
    getById(id: string): DeepReadonly<T> | undefined;

    push(item: DraftInput<T>): void;
    insert(index: number, item: DraftInput<T>): void;
    move(id: string, index: number): void;
    reorder(ids: readonly string[]): void;
    remove(id: string): void;
    update(id: string, map: (item: DeepReadonly<T>) => DraftInput<T>): void;
}
