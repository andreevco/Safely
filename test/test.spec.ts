import { describe, expect, it, beforeEach } from "vitest";
import { createStorage, Storage } from "../src";
import { z } from "zod";
import {
  defineVersionHList,
  hCons,
  hNil,
} from "../src/core/versioning/version";
import { ContainerSlot, createOriginContainer } from "../src/core/slots";
import { cloneSlot, slotFromJson } from "../src/core/slots/slot-json";
import { projection } from "../src/core/versioning/projection";

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

const projectV1ToV2 = projection(schemaV1, schemaV2, (s) => ({
  key1: s.copy(),
  key2: s.copy(),
  key3: s.default(false),
}));

const projectV2ToV1 = projection(schemaV2, schemaV1, (s) => ({
  key1: s.copy(),
  key2: s.copy(),
}));

const projectV2ToV3 = projection(schemaV2, schemaV3, (s) => ({
  key1: s.copy(),
  label: s.from("key2"),
  key3: s.copy(),
  key4: s.default("v3"),
}));

const projectV3ToV2 = projection(schemaV3, schemaV2, (s) => ({
  key1: s.copy(),
  key2: s.from("label"),
  key3: s.copy(),
}));

function identityProjection(source: ContainerSlot): ContainerSlot {
  return cloneSlot(source);
}

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
      projectUp: projectV2ToV3,
      projectDown: projectV3ToV2,
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
        projectUp: projectV1ToV2,
        projectDown: projectV2ToV1,
      },
      hCons(
        {
          version: 1,
          schema: schemaV1,
          initial: {
            key1: 0,
            key2: "initial",
          },
          projectUp: identityProjection,
          projectDown: identityProjection,
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
      projectUp: identityProjection,
      projectDown: identityProjection,
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
          projectUp: identityProjection,
          projectDown: identityProjection,
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
        2_000_000_000,
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
    expect(versionSlot.v.key1.t).toBeLessThan(2_000_000_000);
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
        key2: { v: "updated", a: "device-1" },
        key3: { v: false, t: 0 },
      },
    });
    expect(exported.v["1"]).toMatchObject({
      v: {
        key1: { v: 10 },
        key2: { v: "updated", a: "device-1" },
      },
    });

    const v3Slot = exported.v["3"] as ContainerSlot;
    const v2Slot = exported.v["2"] as ContainerSlot;
    const v1Slot = exported.v["1"] as ContainerSlot;
    expect(v2Slot.v.key2).toMatchObject({
      t: v3Slot.v.label?.t,
      a: v3Slot.v.label?.a,
    });
    expect(v1Slot.v.key2).toMatchObject({
      t: v3Slot.v.label?.t,
      a: v3Slot.v.label?.a,
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

  it("should migrate older-version edits up after merge", () => {
    const oldDevice = createStorage({
      authorId: "old-device",
      versions: v1,
    });
    const newDevice: Storage<StorageV3> = createStorage({
      authorId: "new-device",
      versions: v3,
    });

    oldDevice.update((draft) => {
      draft.key1 = 42;
      draft.key2 = "from-v1";
    });

    newDevice.merge(oldDevice.export());

    const oldExport = oldDevice.export() as ContainerSlot;
    const newExport = newDevice.export() as ContainerSlot;
    const oldV1 = oldExport.v["1"] as ContainerSlot;
    const newV3 = newExport.v["3"] as ContainerSlot;

    expect(newDevice.read()).toEqual({
      key1: 42,
      label: "from-v1",
      key3: false,
      key4: "v3",
    });
    expect(newV3.v.label).toMatchObject({
      t: oldV1.v.key2?.t,
      a: oldV1.v.key2?.a,
    });
    expect(newV3.v.key4).toMatchObject({ t: 0, a: "" });
  });

  it("should preserve tombstones through raw slot projections", () => {
    const schemaOptionalV1 = z.object({
      keep: z.string(),
      optional: z.string().optional(),
    });
    const schemaOptionalV2 = z.object({
      keep: z.string(),
      renamed: z.string().optional(),
      added: z.boolean(),
    });

    const projectOptionalV1ToV2 = projection(
      schemaOptionalV1,
      schemaOptionalV2,
      (s) => ({
        keep: s.copy(),
        renamed: s.from("optional"),
        added: s.default(false),
      }),
    );

    const projectOptionalV2ToV1 = projection(
      schemaOptionalV2,
      schemaOptionalV1,
      (s) => ({
        keep: s.copy(),
        optional: s.from("renamed"),
      }),
    );

    const optionalV2 = defineVersionHList(
      hCons(
        {
          version: 2,
          schema: schemaOptionalV2,
          initial: {
            keep: "",
            renamed: "initial",
            added: false,
          },
          projectUp: projectOptionalV1ToV2,
          projectDown: projectOptionalV2ToV1,
        },
        hCons(
          {
            version: 1,
            schema: schemaOptionalV1,
            initial: {
              keep: "",
              optional: "initial",
            },
            projectUp: identityProjection,
            projectDown: identityProjection,
          },
          hNil,
        ),
      ),
    );
    const optionalV1 = defineVersionHList(
      hCons(
        {
          version: 1,
          schema: schemaOptionalV1,
          initial: {
            keep: "",
            optional: "initial",
          },
          projectUp: identityProjection,
          projectDown: identityProjection,
        },
        hNil,
      ),
    );

    const oldDevice = createStorage({
      authorId: "old-device",
      versions: optionalV1,
    });
    const newDevice = createStorage({
      authorId: "new-device",
      versions: optionalV2,
    });

    oldDevice.update((draft) => {
      delete draft.optional;
    });

    newDevice.merge(oldDevice.export());

    const oldExport = oldDevice.export() as ContainerSlot;
    const newExport = newDevice.export() as ContainerSlot;
    const oldTombstone = (oldExport.v["1"] as ContainerSlot).v.optional;
    const projectedTombstone = (newExport.v["2"] as ContainerSlot).v.renamed;

    expect(projectedTombstone).toEqual(oldTombstone);
    expect(projectedTombstone).toMatchObject({ d: true, a: "old-device" });
  });

  // it("should choose the newest slot when projected fields collide", () => {
  //   const projected = projectV2ToV3(
  //     createOriginContainer({
  //       key1: slot(0),
  //       key2: slot("older-label", 10, "A"),
  //       key3: slot(false),
  //       label: slot("newer-label", 11, "B"),
  //     }),
  //   );
  //
  //   expect(projected.v.label).toMatchObject({
  //     v: "newer-label",
  //     t: 11,
  //     a: "B",
  //   });
  // });
});
