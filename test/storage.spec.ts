import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createStorage, type Storage } from "../src";
import { schemaV1, v1 } from "./version-fixtures";
import { ContainerSlot } from "../src/core/slots";
import {
  defineVersionHList,
  hCons,
  hNil,
} from "../src/core/versioning/version";
import { cloneSlot } from "../src/core/slots/slot-json";

describe("storage updates", () => {
  let storage: Storage<z.output<typeof schemaV1>>;

  beforeEach(() => {
    storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });
  });

  it("updates values", () => {
    storage.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "value2";
    });

    expect(storage.read().key1).toEqual(10);
    expect(storage.read().key2).toEqual("value2");
  });

  it("reads current values from an update draft", () => {
    storage.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "value";
      draft.key1 = draft.key1 + 5;
      draft.key2 = `${draft.key2}-updated`;
    });

    expect(storage.read().key1).toEqual(15);
    expect(storage.read().key2).toEqual("value-updated");
  });

  it("leaves storage unchanged when update fails schema validation", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    storage.update((draft) => {
      draft.key1 = 10;
    });

    expect(() =>
      storage.update((draft) => {
        // @ts-expect-error intentional invalid runtime write
        draft.key1 = "invalid";
      }),
    ).toThrow();

    expect(storage.read()).toEqual({
      key1: 10,
      key2: "initial",
    });
  });

  it("leaves storage unchanged when update callback throws", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    expect(() =>
      storage.update((draft) => {
        draft.key1 = 10;
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(storage.read()).toEqual({
      key1: 0,
      key2: "initial",
    });
  });

  it("export returns a deep clone", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    const exported = storage.export() as any;
    exported.v["1"].v.key1.v = 999;

    expect(storage.read()).toEqual({
      key1: 0,
      key2: "initial",
    });
  });

  it("uses one timestamp for all writes in one transaction", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    storage.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "updated";
    });

    const exported = storage.export() as ContainerSlot;
    const versionSlot = exported.v["1"] as ContainerSlot;

    expect(versionSlot.v.key1?.t).toBe(versionSlot.v.key2?.t);
    expect(versionSlot.v.key1?.a).toBe("device-1");
    expect(versionSlot.v.key2?.a).toBe("device-1");
  });

  it("distinguishes null values from deleted fields", () => {
    const schema = z.object({
      maybe: z.string().nullable().optional(),
    });

    const versions = defineVersionHList(
      hCons(
        {
          version: 1,
          schema,
          initial: {
            maybe: "initial",
          },
          projectUp: cloneSlot,
          projectDown: cloneSlot,
        },
        hNil,
      ),
    );

    const storage = createStorage({
      authorId: "device-1",
      versions,
    });

    storage.update((draft) => {
      draft.maybe = null;
    });

    expect(storage.read()).toEqual({
      maybe: null,
    });

    storage.update((draft) => {
      delete draft.maybe;
    });

    expect(storage.read()).toEqual({});
  });
});
