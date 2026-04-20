import { z } from 'zod';

export type AnySchema = z.ZodTypeAny;
export type AnySchemaRecord = Record<string, AnySchema>;

export type OutputOfRecord<T extends AnySchemaRecord> = {
    [K in keyof T]: z.output<T[K]>;
};

export type StorageVersion<Old extends AnySchemaRecord, New extends AnySchemaRecord> = {
    version: number;
    schema: New;
    migrate: (old: OutputOfRecord<Old>) => OutputOfRecord<New>;
    reverseMigrate: (newData: OutputOfRecord<New>) => OutputOfRecord<Old>;
};

export type AnyStorageVersion = StorageVersion<AnySchemaRecord, AnySchemaRecord>;

type OldOf<V> =
    V extends StorageVersion<infer Old extends AnySchemaRecord, infer _New extends AnySchemaRecord>
        ? Old
        : never;

type NewOf<V> =
    V extends StorageVersion<infer _Old extends AnySchemaRecord, infer New extends AnySchemaRecord>
        ? New
        : never;

type IsStorageVersion<V> =
    V extends StorageVersion<infer _Old extends AnySchemaRecord, infer _New extends AnySchemaRecord>
        ? true
        : false;

export type AssertVersionChain<V extends readonly unknown[]> = V extends readonly []
    ? readonly []
    : V extends readonly [infer A]
      ? IsStorageVersion<A> extends true
          ? readonly [A]
          : never
      : V extends readonly [infer A, infer B, ...infer Rest]
        ? IsStorageVersion<A> extends true
            ? IsStorageVersion<B> extends true
                ? [NewOf<A>] extends [OldOf<B>]
                    ? readonly [A, ...AssertVersionChain<readonly [B, ...Rest]>]
                    : never
                : never
            : never
        : never;

export type LastNew<V extends readonly unknown[]> = V extends readonly [...unknown[], infer Z]
    ? NewOf<Z>
    : never;

export function defineStorageVersion<Old extends AnySchemaRecord, New extends AnySchemaRecord>(
    version: StorageVersion<Old, New>
): StorageVersion<Old, New> {
    return version;
}

export function defineVersionChain<const V extends unknown[]>(
    ...versions: V & AssertVersionChain<V>
): V {
    return versions;
}

// Type StorageVersion is invariant and there is no way in TypeScript to express
// covariance of the version chain
export function chainToRuntimeArray<V extends readonly unknown[]>(
    versions: V & AssertVersionChain<V>
): AnyStorageVersion[] {
    return versions as unknown as AnyStorageVersion[];
}
