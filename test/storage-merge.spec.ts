import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createStorage, type Storage } from "../src";
import { createOriginContainer } from "../src/core/slots";
import { slotFromJson } from "../src/core/slots/slot-json";
import { schemaV1, v1 } from "./version-fixtures";

describe("storage merge", () => {
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

  it("merges values", () => {
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

  it("leaves storage unchanged when an incoming merge fails validation", () => {
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
});
