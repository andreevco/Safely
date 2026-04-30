import type {
  AnyObject,
  CopyRule,
  DefaultRule,
  FromRule,
  NoMap,
  NonNullableObject,
  NonNullableRecordValue,
  ObjectFromRule,
  ProjectionBuilder,
  ProjectionMap,
  ProjectionShape,
  ProjectionValue,
  RecordFromRule,
  StringKeyOf,
} from "./types";

export function createProjectionBuilder<From>(): ProjectionBuilder<From> {
  const copy = ((
    map?: ProjectionMap<unknown, ProjectionValue>,
  ): CopyRule<NoMap> | CopyRule<ProjectionValue> => {
    return {
      kind: "copy",
      map,
    } as CopyRule<NoMap> | CopyRule<ProjectionValue>;
  }) as ProjectionBuilder<From>["copy"];

  const from = (<K extends StringKeyOf<From>>(
    key: K,
    map?: ProjectionMap<From[K], ProjectionValue>,
  ): FromRule<K, NoMap> | FromRule<K, ProjectionValue> => {
    return {
      kind: "from",
      key,
      map: map as ProjectionMap<unknown, ProjectionValue> | undefined,
    } as FromRule<K, NoMap> | FromRule<K, ProjectionValue>;
  }) as ProjectionBuilder<From>["from"];

  const defaultValue = (<Output extends ProjectionValue>(
    value: Output | (() => Output),
  ): DefaultRule<Output> => {
    return {
      kind: "default",
      value,
    } as DefaultRule<Output>;
  }) as ProjectionBuilder<From>["default"];

  const objectFrom = (<K extends StringKeyOf<From>, To extends AnyObject>(
    key: K,
    build: (
      s: ProjectionBuilder<NonNullableObject<From[K]>>,
    ) => ProjectionShape<NonNullableObject<From[K]>, To>,
  ): ObjectFromRule<K, To> => {
    const nestedBuilder = createProjectionBuilder<NonNullableObject<From[K]>>();

    return {
      kind: "objectFrom",
      key,
      shape: build(nestedBuilder) as ProjectionShape<AnyObject, To>,
    } as ObjectFromRule<K, To>;
  }) as ProjectionBuilder<From>["objectFrom"];

  const recordFrom = (<K extends StringKeyOf<From>, ToValue extends AnyObject>(
    key: K,
    build: (
      recordKey: string,
      s: ProjectionBuilder<NonNullableRecordValue<From[K]>>,
    ) => ProjectionShape<NonNullableRecordValue<From[K]>, ToValue>,
  ): RecordFromRule<K, Record<string, ToValue>> => {
    return {
      kind: "recordFrom",
      key,
      build: (recordKey: string, s: ProjectionBuilder<AnyObject>) => {
        return build(
          recordKey,
          s as ProjectionBuilder<NonNullableRecordValue<From[K]>>,
        ) as ProjectionShape<AnyObject, ToValue>;
      },
    } as RecordFromRule<K, Record<string, ToValue>>;
  }) as ProjectionBuilder<From>["recordFrom"];

  return {
    copy,
    from,
    default: defaultValue,
    objectFrom,
    recordFrom,
  };
}
