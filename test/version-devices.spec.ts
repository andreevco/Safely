import { describe, expect, it } from "vitest";
import { createStorage } from "../src";
import { createOriginContainer, type ContainerSlot } from "../src/core/slots";
import { slotFromJson, stripSlot } from "../src/core/slots/slot-json";
import { DEVICES_KEY } from "../src/core/versioning/version-controller";
import { v3 } from "./version-fixtures";

const v3Initial = {
  key1: 0,
  label: "initial",
  key3: false,
  key4: "v3",
};

describe("storage device versions", () => {
  it("records the current device schema version when storage is created", () => {
    const storage = createStorage({
      authorId: "device-1",
      versions: v3,
    });

    const exported = storage.export() as ContainerSlot;

    expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
      "device-1": {
        version: 3,
      },
    });
  });

  it("updates the current device version when it differs from the latest schema version", () => {
    const root = createOriginContainer({
      "3": slotFromJson(v3Initial, 0, ""),
      [DEVICES_KEY]: slotFromJson(
        {
          "device-1": { version: 1 },
          "old-device": { version: 1 },
        },
        0,
        "",
      ),
    });

    const storage = createStorage({
      authorId: "device-1",
      versions: v3,
      root,
    });

    const exported = storage.export() as ContainerSlot;

    expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
      "device-1": {
        version: 3,
      },
      "old-device": {
        version: 1,
      },
    });
  });

  it("deletes schema versions that are not used by any device", () => {
    const root = createOriginContainer({
      "1": slotFromJson({ key1: 10, key2: "legacy" }, 0, ""),
      "3": slotFromJson(v3Initial, 0, ""),
      [DEVICES_KEY]: slotFromJson(
        {
          "device-1": { version: 3 },
        },
        0,
        "",
      ),
    });

    const storage = createStorage({
      authorId: "device-1",
      versions: v3,
      root,
    });

    const exported = storage.export() as ContainerSlot;

    expect(exported.v["1"]).toBeUndefined();
    expect(exported.v["3"]).toBeDefined();
  });

  it("keeps schema versions that are still used by another device", () => {
    const root = createOriginContainer({
      "1": slotFromJson({ key1: 10, key2: "legacy" }, 0, ""),
      "3": slotFromJson(v3Initial, 0, ""),
      [DEVICES_KEY]: slotFromJson(
        {
          "device-1": { version: 3 },
          "old-device": { version: 1 },
        },
        0,
        "",
      ),
    });

    const storage = createStorage({
      authorId: "device-1",
      versions: v3,
      root,
    });

    const exported = storage.export() as ContainerSlot;

    expect(exported.v["1"]).toBeDefined();
    expect(exported.v["3"]).toBeDefined();
  });
});
