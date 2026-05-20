import type { DeepReadonly, JsonValue } from '../../json';

type DraftValue<T> = Exclude<T, undefined>;
export type DraftInput<T> = DraftValue<T> extends JsonValue ? DraftValue<T> : JsonValue;
type DraftMap<T> = (input: Draft<T>) => Draft<T>;

export type Draft<T> = [Extract<DraftValue<T>, readonly unknown[]>] extends [never]
    ? [Exclude<DraftValue<T>, object | null>] extends [never]
        ? ObjectDraft<Extract<DraftValue<T>, object>>
        : AtomicDraft<DraftValue<T>>
    : Extract<DraftValue<T>, readonly unknown[]> extends readonly (infer Item)[]
      ? [Item] extends [{ __setId: string }]
          ? ArrayDraft<Item>
          : never
      : never;

export interface AtomicDraft<T> {
    get(): DeepReadonly<T> | undefined;
    set(value: DraftInput<T>): void;
}

export interface ObjectDraft<T extends object> {
    at<K extends Extract<keyof T, string>>(key: K): Draft<T[K]>;
    set<K extends Extract<keyof T, string>>(key: K, value: DraftInput<T[K]>): void;
    set<K extends Extract<keyof T, string>>(key: K, map: DraftMap<T[K]>): void;
    delete<K extends Extract<keyof T, string>>(key: K): void;
    get(): DeepReadonly<T> | undefined;
    narrow<S extends T>(guard: (value: T) => value is S): ObjectDraft<S> | undefined;
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
    update(id: string, map: (item: Draft<T>) => void): void;
}
