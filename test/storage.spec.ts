import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createStorage, type Storage } from "../src";
import { schemaV1, v1 } from "./version-fixtures";

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
});
