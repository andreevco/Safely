import { z } from "zod";
import type { ContainerSlot } from "./slots";

export type AnySchema = z.ZodTypeAny;

export type StorageVersion<
  Old extends AnySchema = AnySchema,
  New extends AnySchema = AnySchema,
> = {
  readonly __oldSchema?: Old;
  version: number;
  schema: New;
  initial: z.output<New> | (() => z.output<New>);
  projectUp: (old: ContainerSlot) => ContainerSlot;
  projectDown: (newData: ContainerSlot) => ContainerSlot;
};

type OldOf<V> =
  V extends StorageVersion<infer Old extends AnySchema, AnySchema>
    ? Old
    : never;

export type NewOf<V> = V extends { schema: infer New extends AnySchema }
  ? New
  : never;

export interface HNil {
  readonly _tag: "HNil";
}

export interface HCons<Head, Tail> {
  readonly _tag: "HCons";
  readonly head: Head;
  readonly tail: Tail;
}

export const hNil: HNil = {
  _tag: "HNil",
};

type OlderSchemaFor<Tail, Fallback extends AnySchema> =
  Tail extends HCons<infer Older extends StorageVersion, unknown>
    ? NewOf<Older>
    : Fallback;

export function hCons<
  New extends AnySchema,
  Tail extends HNil | HCons<StorageVersion, unknown>,
>(
  head: StorageVersion<OlderSchemaFor<Tail, New>, New>,
  tail: Tail,
): HCons<StorageVersion<OlderSchemaFor<Tail, New>, New>, Tail> {
  return {
    _tag: "HCons",
    head,
    tail,
  };
}

export type AssertVersionHList<List> = List extends HNil
  ? HNil
  : List extends HCons<unknown, HNil>
    ? List
    : List extends HCons<infer Newer, HCons<infer Older, infer Rest>>
      ? [NewOf<Older>] extends [OldOf<Newer>]
        ? HCons<Newer, AssertVersionHList<HCons<Older, Rest>>>
        : never
      : never;

export function defineVersionHList<List>(
  versions: List & AssertVersionHList<List>,
): List {
  return versions;
}

export function hListToRuntimeArray<V1 extends StorageVersion, Rest>(
  versions: HCons<V1, Rest> & AssertVersionHList<HCons<V1, Rest>>,
): StorageVersion[] {
  const result: StorageVersion[] = [];
  let cursor: HCons<StorageVersion, unknown> | HNil = versions;

  while (cursor._tag === "HCons") {
    result.unshift(cursor.head);
    cursor = cursor.tail as HCons<StorageVersion, unknown> | HNil;
  }

  return result;
}
