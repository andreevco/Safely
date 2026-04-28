import { describe, expect, it, beforeEach } from "vitest";
import { createStorage, Storage } from "../src";
import { z } from "zod";
import { defineVersionHList, hCons, hNil } from "../src/core/version";
import { createOriginContainer } from "../src/core/slots";
import { slotFromJson } from "../src/core/slots/slot-json";

const schemaV1 = z.object({
  key1: z.number(),
  key2: z.string(),
});

const schemaV2 = z.object({
  key1: z.number(),
  key2: z.string(),
  key3: z.boolean(),
});

const schemaV3 = z.object({
  key1: z.number(),
  label: z.string(),
  key3: z.boolean(),
  key4: z.string(),
});

type StorageV3 = z.output<typeof schemaV3>;

const v3 = defineVersionHList(
  hCons(
    {
      version: 3,
      schema: schemaV3,
      initial: {
        key1: 0,
        label: "initial",
        key3: false,
        key4: "v3",
      },
      migrate: (prev) => {
        return {
          key1: prev.key1,
          label: prev.key2,
          key3: prev.key3,
          key4: "v3",
        };
      },
      reverseMigrate: (current) => {
        return {
          key1: current.key1,
          key2: current.label,
          key3: current.key3,
        };
      },
    },
    hCons(
      {
        version: 2,
        schema: schemaV2,
        initial: {
          key1: 0,
          key2: "initial",
          key3: false,
        },
        migrate: (prev) => {
          return {
            key1: prev.key1,
            key2: prev.key2,
            key3: false,
          };
        },
        reverseMigrate: (current) => {
          return {
            key1: current.key1,
            key2: current.key2,
          };
        },
      },
      hCons(
        {
          version: 1,
          schema: schemaV1,
          initial: {
            key1: 0,
            key2: "initial",
          },
          migrate: (prev) => prev,
          reverseMigrate: (current) => current,
        },
        hNil,
      ),
    ),
  ),
);

const v1 = defineVersionHList(
  hCons(
    {
      version: 1,
      schema: schemaV1,
      initial: {
        key1: 0,
        key2: "initial",
      },
      migrate: (prev) => prev,
      reverseMigrate: (current) => current,
    },
    hNil,
  ),
);

describe("test", () => {
  let storage1: Storage<z.output<typeof schemaV1>>;
  let storage2: Storage<z.output<typeof schemaV1>>;

  beforeEach(() => {
    storage1 = createStorage({
      authorId: "device-1",
      versions: v1,
    });
    storage2 = createStorage({
      authorId: "device-2",
      versions: v1,
    });
  });

  it("should update values", () => {
    storage1.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "value2";
    });
    expect(storage1.read().key1).toEqual(10);
    expect(storage1.read().key2).toEqual("value2");
  });

  it("should read current values from an update draft", () => {
    storage1.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "value";
      draft.key1 = draft.key1 + 5;
      draft.key2 = `${draft.key2}-updated`;
    });

    expect(storage1.read().key1).toEqual(15);
    expect(storage1.read().key2).toEqual("value-updated");
  });

  it("should set & delete keys in record", () => {
    const version = defineVersionHList(
      hCons(
        {
          version: 1,
          schema: z.object({
            objects: z.record(z.string(), z.number()),
          }),
          initial: {
            objects: {
              key1: 0,
              key2: 1,
            },
          },
          migrate: (prev) => prev,
          reverseMigrate: (current) => current,
        },
        hNil,
      ),
    );

    const storage = createStorage({
      authorId: "device-1",
      versions: version,
    });

    storage.update((draft) => {
      draft.objects["key3"] = 3;
      delete draft.objects["key1"];
    });

    expect(storage.read().objects).toEqual({
      key2: 1,
      key3: 3,
    });
  });

  it("should merge values", () => {
    storage1.update((draft) => {
      draft.key1 = 10;
    });
    storage2.update((draft) => {
      draft.key2 = "value2";
    });

    storage1.merge(storage2.export());
    expect(storage1.read().key1).toEqual(10);
    expect(storage1.read().key2).toEqual("value2");

    storage2.merge(storage1.export());
    expect(storage2.read().key1).toEqual(10);
    expect(storage2.read().key2).toEqual("value2");
  });

  it("should leave storage unchanged when an incoming merge fails validation", () => {
    const incoming = createOriginContainer({
      "1": slotFromJson(
        { key1: "invalid", key2: "value2" },
        1_000_000_000,
        "remote",
      ),
    });

    expect(() => storage1.merge(incoming)).toThrow();
    expect(storage1.read()).toEqual({ key1: 0, key2: "initial" });

    storage1.update((draft) => {
      draft.key1 = 1;
    });
    const exported = storage1.export() as ReturnType<
      typeof createOriginContainer
    >;
    const versionSlot = exported.v["1"] as unknown as {
      v: { key1: { t: number } };
    };
    expect(versionSlot.v.key1.t).toBeLessThan(1_000_000_000);
  });

  it("should propagate latest updates to existing older versions", () => {
    const root = createOriginContainer({
      "1": slotFromJson({ key1: 0, key2: "initial" }, 0, ""),
      "2": slotFromJson({ key1: 0, key2: "initial", key3: false }, 0, ""),
      "3": slotFromJson(
        { key1: 0, label: "initial", key3: false, key4: "v3" },
        0,
        "",
      ),
    });

    const storage: Storage<StorageV3> = createStorage({
      authorId: "device-1",
      versions: v3,
      root,
    });

    storage.update((draft) => {
      draft.key1 = 10;
      draft.label = "updated";
      draft.key4 = "latest-only";
    });

    const exported = storage.export() as ReturnType<
      typeof createOriginContainer
    >;
    expect(exported.v["2"]).toMatchObject({
      v: {
        key1: { v: 10 },
        key2: { v: "updated" },
        key3: { v: false, t: 0 },
      },
    });
    expect(exported.v["1"]).toMatchObject({
      v: {
        key1: { v: 10 },
        key2: { v: "updated" },
      },
    });
  });

  it("should propagate through missing older versions without creating them", () => {
    const root = createOriginContainer({
      "1": slotFromJson({ key1: 0, key2: "initial" }, 0, ""),
      "3": slotFromJson(
        { key1: 0, label: "initial", key3: false, key4: "v3" },
        0,
        "",
      ),
    });

    const storage: Storage<z.output<typeof schemaV3>> = createStorage({
      authorId: "device-1",
      versions: v3,
      root,
    });

    storage.update((draft) => {
      draft.label = "updated";
    });

    const exported = storage.export() as ReturnType<
      typeof createOriginContainer
    >;
    expect(exported.v["2"]).toBeUndefined();
    expect(exported.v["1"]).toMatchObject({
      v: {
        key1: { v: 0, t: 0 },
        key2: { v: "updated" },
      },
    });
  });
});
