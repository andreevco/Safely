import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createStorage, type Storage, StorageImpl } from "../src";
import { schemaV1, StorageV1, v1 } from "./version-fixtures";
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

  it("notifies observers after successful updates", () => {
    const calls: Array<z.output<typeof schemaV1>> = [];

    storage.onChange(() => {
      calls.push(storage.get());
    });

    storage.update((draft) => {
      draft.key1 = 10;
    });

    expect(calls).toEqual([
      {
        key1: 10,
        key2: "initial",
      },
    ]);
  });

  it("removes observers through the onChange cleanup function", () => {
    let calls = 0;
    const remove = storage.onChange(() => {
      calls += 1;
    });

    storage.update((draft) => {
      draft.key1 = 10;
    });
    remove();
    storage.update((draft) => {
      draft.key1 = 20;
    });

    expect(calls).toBe(1);
  });

  it("does not notify observers when an update does not change storage", () => {
    let calls = 0;
    storage.onChange(() => {
      calls += 1;
    });

    storage.update(() => {});

    expect(calls).toBe(0);
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

  it("does not notify observers when update fails", () => {
    let calls = 0;
    storage.onChange(() => {
      calls += 1;
    });

    expect(() =>
      storage.update((draft) => {
        draft.key1 = 10;
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(calls).toBe(0);
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
    }) as StorageImpl<StorageV1>;

    const exported = storage.exportSlot() as ContainerSlot;
    const versionSlot = exported.v["1"] as ContainerSlot;
    const key1Slot = versionSlot.v.key1;

    if (key1Slot === undefined || key1Slot.r === true || key1Slot.d === true) {
      throw new Error("Expected key1 to be an atomic slot");
    }

    key1Slot.v = 999;

    expect(storage.read()).toEqual({
      key1: 0,
      key2: "initial",
    });
  });

  it("prevents runtime writes through read proxies", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    const readable = storage.read();

    expect(() => {
      // @ts-expect-error intentional runtime write attempt
      readable.key1 = 999;
    }).toThrow(TypeError);
    expect(() => {
      // @ts-expect-error intentional runtime delete attempt
      delete readable.key2;
    }).toThrow(TypeError);
    expect(() =>
      Object.defineProperty(readable, "key1", {
        value: 999,
      }),
    ).toThrow(TypeError);
    expect(() => Object.setPrototypeOf(readable, {})).toThrow(TypeError);
    expect(storage.read()).toEqual({
      key1: 0,
      key2: "initial",
    });
  });

  it("supports object helpers on read proxies", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    });

    storage.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "updated";
    });

    const readable = storage.read();

    expect(Object.keys(readable)).toEqual(["key1", "key2"]);
    expect("key1" in readable).toBe(true);
    expect("missing" in readable).toBe(false);
    expect({ ...readable }).toEqual({
      key1: 10,
      key2: "updated",
    });
    expect(JSON.stringify(readable)).toBe(
      JSON.stringify({
        key1: 10,
        key2: "updated",
      }),
    );
    expect(Object.getOwnPropertyDescriptor(readable, "key1")).toMatchObject({
      configurable: true,
      enumerable: true,
      writable: false,
      value: 10,
    });
  });

  it("prevents runtime writes through nested read proxies", () => {
    const schema = z.object({
      settings: z.object({
        theme: z.string(),
      }),
    });

    const versions = defineVersionHList(
      hCons(
        {
          version: 1,
          schema,
          initial: {
            settings: {
              theme: "light",
            },
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
    const readable = storage.read();

    expect(() => {
      // @ts-expect-error intentional runtime write attempt
      readable.settings.theme = "dark";
    }).toThrow(TypeError);
    expect(() => {
      // @ts-expect-error intentional runtime delete attempt
      delete readable.settings.theme;
    }).toThrow(TypeError);
    expect(storage.read()).toEqual({
      settings: {
        theme: "light",
      },
    });
  });

  it("returns cloned arrays from read proxies", () => {
    const schema = z.object({
      items: z.array(z.string()),
    });

    const versions = defineVersionHList(
      hCons(
        {
          version: 1,
          schema,
          initial: {
            items: ["one"],
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

    const items = storage.read().items as string[];
    items.push("mutated clone");

    expect(items).toEqual(["one", "mutated clone"]);
    expect(storage.read()).toEqual({
      items: ["one"],
    });
  });

  it("uses one timestamp for all writes in one transaction", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v1,
    }) as StorageImpl<StorageV1>;

    storage.update((draft) => {
      draft.key1 = 10;
      draft.key2 = "updated";
    });

    const exported = storage.exportSlot() as ContainerSlot;
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
