import type {
    AnyObject,
    DefaultRule,
    FromRule,
    MapRule,
    NoMap,
    NonNullableObject,
    NonNullableRecordValue,
    ObjectFromRule,
    ProjectionBuilder,
    ProjectionMap,
    ProjectionShape,
    ProjectionValue,
    RecordFromRule,
    StringKeyOf
} from './types';

export function createProjectionBuilder<From>(): ProjectionBuilder<From> {
    const copy = (() => {
        return {
            kind: 'copy'
        };
    }) as ProjectionBuilder<From>['copy'];

    const from = (<K extends StringKeyOf<From>>(key: K): FromRule<K, NoMap> => {
        return {
            kind: 'from',
            key
        };
    }) as ProjectionBuilder<From>['from'];

    const map = ((
        keyOrMap: StringKeyOf<From> | ProjectionMap<unknown, ProjectionValue>,
        maybeMap?: ProjectionMap<unknown, ProjectionValue>
    ): MapRule<StringKeyOf<From> | undefined, ProjectionValue> => {
        if (typeof keyOrMap === 'function') {
            return {
                kind: 'map',
                map: keyOrMap
            };
        }

        return {
            kind: 'map',
            key: keyOrMap,
            map: maybeMap as ProjectionMap<unknown, ProjectionValue>
        };
    }) as ProjectionBuilder<From>['map'];

    const defaultValue = (<Output extends ProjectionValue>(
        value: Output | (() => Output)
    ): DefaultRule<Output> => {
        return {
            kind: 'default',
            value
        };
    }) as ProjectionBuilder<From>['default'];

    const objectFrom = (<K extends StringKeyOf<From>, To extends AnyObject>(
        key: K,
        build: (
            s: ProjectionBuilder<NonNullableObject<From[K]>>
        ) => ProjectionShape<NonNullableObject<From[K]>, To>
    ): ObjectFromRule<K, To> => {
        const nestedBuilder = createProjectionBuilder<NonNullableObject<From[K]>>();

        return {
            kind: 'objectFrom',
            key,
            shape: build(nestedBuilder) as ProjectionShape<AnyObject, To>
        };
    }) as ProjectionBuilder<From>['objectFrom'];

    const recordFrom = (<K extends StringKeyOf<From>, ToValue extends AnyObject>(
        key: K,
        build: (
            recordKey: string,
            s: ProjectionBuilder<NonNullableRecordValue<From[K]>>
        ) => ProjectionShape<NonNullableRecordValue<From[K]>, ToValue>
    ): RecordFromRule<K, Record<string, ToValue>> => {
        return {
            kind: 'recordFrom',
            key,
            build: (recordKey: string, s: ProjectionBuilder<AnyObject>) => {
                return build(
                    recordKey,
                    // TODO: fix type assertion
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                    s as ProjectionBuilder<NonNullableRecordValue<From[K]>>
                ) as ProjectionShape<AnyObject, ToValue>;
            }
        };
    }) as ProjectionBuilder<From>['recordFrom'];

    return {
        copy,
        from,
        map,
        default: defaultValue,
        objectFrom,
        recordFrom
    };
}
