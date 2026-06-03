import type { z } from 'zod';

import type { DeepReadonly, JsonValue } from '../../json';
import type { ContainerSlot } from '../../slots';

export type AnySchema = z.ZodTypeAny;
export type AnyObject = Record<string, unknown>;
export type RecordValue<T> = NonNullable<T> extends Record<string, infer Value> ? Value : never;

export type StringKeyOf<T> = Extract<keyof T, string>;

type OptionalKeys<T> = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

export type NonNullableObject<T> = Extract<NonNullable<T>, AnyObject>;
export type NonNullableRecordValue<T> = NonNullableObject<RecordValue<T>>;

export type ProjectionValue = JsonValue | undefined;
type JsonCompatible<T> = Extract<T, ProjectionValue>;

declare const _noMapMarker: unique symbol;
export type NoMap = typeof _noMapMarker;

declare const outputBrand: unique symbol;

type OutputBrand<T> = {
    readonly [outputBrand]?: T;
};

export type ProjectionMap<Input, Output extends ProjectionValue> = (
    value: DeepReadonly<Input>
) => Output;

export interface CopyRule<Output = NoMap> extends OutputBrand<Output> {
    readonly kind: 'copy';
}

export interface FromRule<Key extends string, Output = NoMap> extends OutputBrand<Output> {
    readonly kind: 'from';
    readonly key: Key;
}

export interface MapRule<
    Key extends string | undefined,
    Output extends ProjectionValue
> extends OutputBrand<Output> {
    readonly kind: 'map';
    readonly key?: Key;
    readonly map: ProjectionMap<unknown, Output>;
}

export interface DefaultRule<Output extends ProjectionValue> extends OutputBrand<Output> {
    readonly kind: 'default';
    readonly value: Output | (() => Output);
}

export interface ObjectFromRule<
    Key extends string,
    Output extends AnyObject
> extends OutputBrand<Output> {
    readonly kind: 'objectFrom';
    readonly key: Key;
    readonly shape: ProjectionShape<AnyObject, Output>;
}

export interface RecordFromRule<
    Key extends string,
    Output extends Record<string, AnyObject>
> extends OutputBrand<Output> {
    readonly kind: 'recordFrom';
    readonly key: Key;
    readonly build: (
        key: string,
        s: ProjectionBuilder<NonNullableRecordValue<Output[string]>>
    ) => ProjectionShape<AnyObject, RecordValue<Output>>;
}

type CopyFieldRule<From, Target, TargetKey extends string> = TargetKey extends keyof From
    ? [From[TargetKey]] extends [Target]
        ? CopyRule<NoMap>
        : never
    : never;

type FromFieldRule<From, Target> = {
    [K in StringKeyOf<From>]: [From[K]] extends [Target] ? FromRule<K, NoMap> : never;
}[StringKeyOf<From>];

type MapFieldRule<From, Target, TargetKey extends string> =
    | (TargetKey extends keyof From ? MapRule<undefined, JsonCompatible<Target>> : never)
    | {
          [K in StringKeyOf<From>]: MapRule<K, JsonCompatible<Target>>;
      }[StringKeyOf<From>];

type DefaultFieldRule<Target> = DefaultRule<JsonCompatible<Target>>;

type ObjectFromFieldRule<From, Target> =
    NonNullable<Target> extends AnyObject
        ? {
              [K in StringKeyOf<From>]: NonNullable<From[K]> extends AnyObject
                  ? ObjectFromRule<K, NonNullableObject<Target>>
                  : never;
          }[StringKeyOf<From>]
        : never;

type RecordFromFieldRule<From, Target> =
    NonNullable<Target> extends Record<string, AnyObject>
        ? {
              [K in StringKeyOf<From>]: NonNullable<From[K]> extends Record<string, AnyObject>
                  ? RecordFromRule<K, NonNullable<Target>>
                  : never;
          }[StringKeyOf<From>]
        : never;

export type FieldProjectionRule<From, Target, TargetKey extends string> =
    | CopyFieldRule<From, Target, TargetKey>
    | FromFieldRule<From, Target>
    | MapFieldRule<From, Target, TargetKey>
    | DefaultFieldRule<Target>
    | ObjectFromFieldRule<From, Target>
    | RecordFromFieldRule<From, Target>;

export type ProjectionShape<From, To> = {
    [K in Extract<RequiredKeys<To>, string>]-?: FieldProjectionRule<From, To[K], K>;
} & {
    [K in Extract<OptionalKeys<To>, string>]?: FieldProjectionRule<From, To[K], K>;
};

export interface ProjectionBuilder<From> {
    copy(): CopyRule<NoMap>;

    from<K extends StringKeyOf<From>>(key: K): FromRule<K, NoMap>;

    map<TargetKey extends StringKeyOf<From>, Output extends ProjectionValue>(
        map: ProjectionMap<From[TargetKey], Output>
    ): MapRule<undefined, Output>;

    map<K extends StringKeyOf<From>, Output extends ProjectionValue>(
        key: K,
        map: ProjectionMap<From[K], Output>
    ): MapRule<K, Output>;

    default<Output extends ProjectionValue>(value: Output | (() => Output)): DefaultRule<Output>;

    objectFrom<K extends StringKeyOf<From>, To extends AnyObject>(
        key: K,
        build: (
            s: ProjectionBuilder<NonNullableObject<From[K]>>
        ) => ProjectionShape<NonNullableObject<From[K]>, To>
    ): ObjectFromRule<K, To>;

    recordFrom<K extends StringKeyOf<From>, ToValue extends AnyObject>(
        key: K,
        build: (
            recordKey: string,
            s: ProjectionBuilder<NonNullableRecordValue<From[K]>>
        ) => ProjectionShape<NonNullableRecordValue<From[K]>, ToValue>
    ): RecordFromRule<K, Record<string, ToValue>>;
}

export interface SlotProjection<From extends AnyObject, To extends AnyObject> {
    (source: ContainerSlot): ContainerSlot;

    readonly fromSchema: z.ZodType<From>;
    readonly toSchema: z.ZodType<To>;
    readonly shape: ProjectionShape<From, To>;
}
