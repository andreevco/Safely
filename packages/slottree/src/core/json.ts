export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export function createNullPrototypeRecord<T>(): Record<string, T> {
    return Object.create(null) as Record<string, T>;
}

type JsonLeaf = string | number | boolean | null | JsonValue[];

export type WriteDraft<T> = T extends JsonLeaf
    ? T
    : T extends object
      ? {
            -readonly [K in keyof T]: WriteDraft<T[K]>;
        }
      : never;

export type DeepReadonly<T> = T extends JsonPrimitive
    ? T
    : T extends readonly (infer U)[]
      ? readonly DeepReadonly<U>[]
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : never;

export type Path<T> = T extends JsonValue[]
    ? never
    : T extends object
      ? {
            [K in Extract<keyof T, string>]: T[K] extends JsonValue[]
                ? [K]
                : T[K] extends object
                  ? [K] | [K, ...Path<T[K]>]
                  : [K];
        }[Extract<keyof T, string>]
      : never;

export type PathValue<T, P> = P extends readonly [infer Head, ...infer Tail]
    ? Head extends keyof T
        ? Tail extends []
            ? T[Head]
            : PathValue<T[Head], Tail>
        : never
    : T;
