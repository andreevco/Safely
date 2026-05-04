import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createStorage, StorageImpl } from "../src";
import {
  defineVersionHList,
  hCons,
  hNil,
} from "../src/core/versioning/version";
import { type ContainerSlot } from "../src/core/slots";
import { cloneSlot } from "../src/core/slots/slot-json";

const schema = z.object({
  count: z.number(),
  title: z.string(),
  users: z.record(
    z.string(),
    z.object({
      name: z.string(),
      active: z.boolean().optional(),
    }),
  ),
  flags: z.record(z.string(), z.boolean()),
  settings: z.object({
    theme: z.string(),
    layout: z.string().optional(),
  }),
});

const versions = defineVersionHList(
  hCons(
    {
      version: 1,
      schema,
      initial: {
        count: 0,
        title: "initial",
        users: {},
        flags: {},
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

function createTestStorage() {
  return createStorage({
    authorId: "device-1",
    versions,
  });
}

describe("createWriteProxy", () => {
  it("supports TypeScript object rest and spread patterns on drafts", () => {
    const storage = createTestStorage();

    storage.update((draft) => {
      draft.users.alice = { name: "Alice", active: true };
      draft.users.bob = { name: "Bob" };
      delete draft.users.alice;

      expect(Object.keys(draft.users)).toEqual(["bob"]);
      expect("bob" in draft.users).toBe(true);
      expect("alice" in draft.users).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(draft.users, "bob")).toBe(
        true,
      );
      expect(Object.prototype.hasOwnProperty.call(draft.users, "alice")).toBe(
        false,
      );

      const iterated: string[] = [];
      for (const key in draft.users) {
        iterated.push(key);
      }
      expect(iterated).toEqual(["bob"]);

      const spread = { ...draft.users };
      expect(spread.bob.name).toBe("Bob");

      const { bob, ...rest } = draft.users;
      expect(bob.name).toBe("Bob");
      expect(Object.keys(rest)).toEqual([]);
      expect(JSON.parse(JSON.stringify(draft.users))).toEqual({
        bob: {
          name: "Bob",
        },
      });

      draft.settings = {
        ...draft.settings,
        layout: "dense",
      };
    });

    expect(storage.read()).toEqual({
      count: 0,
      title: "initial",
      users: {
        bob: {
          name: "Bob",
        },
      },
      flags: {},
      settings: {
        theme: "light",
        layout: "dense",
      },
    });
  });

  it("supports descriptor and Object.assign write patterns on drafts", () => {
    const storage = createTestStorage();

    storage.update((draft) => {
      Object.assign(draft.settings, {
        theme: "dark",
        layout: "compact",
      });

      Object.defineProperty(draft.users, "carol", {
        value: { name: "Carol", active: true },
        enumerable: true,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(draft.flags, "ready", {
        value: true,
      });

      const descriptor = Object.getOwnPropertyDescriptor(draft.users, "carol");
      expect(descriptor).toMatchObject({
        configurable: true,
        enumerable: true,
        writable: true,
      });
      expect(descriptor?.value.name).toBe("Carol");
    });

    expect(storage.read()).toEqual({
      count: 0,
      title: "initial",
      users: {
        carol: {
          name: "Carol",
          active: true,
        },
      },
      flags: {
        ready: true,
      },
      settings: {
        theme: "dark",
        layout: "compact",
      },
    });
  });

  it("treats assigning undefined as delete and creates a tombstone", () => {
    const storage = createTestStorage() as StorageImpl<z.output<typeof schema>>;

    storage.update((draft) => {
      draft.settings.layout = "compact";
    });
    storage.update((draft) => {
      draft.settings.layout = undefined;
    });

    expect(storage.read()).toEqual({
      count: 0,
      title: "initial",
      users: {},
      flags: {},
      settings: {
        theme: "light",
      },
    });

    const exported = storage.exportSlot() as ContainerSlot;
    const versionSlot = exported.v["1"] as ContainerSlot;
    const settingsSlot = versionSlot.v.settings as ContainerSlot;

    expect(settingsSlot.v.layout).toMatchObject({
      d: true,
      a: "device-1",
    });
  });

  it("keeps primitive properties as plain values through object helpers", () => {
    const storage = createTestStorage();

    storage.update((draft) => {
      draft.count = draft.count + 1;
      draft.title = `${draft.title}-updated`;

      expect(Object.entries(draft)).toEqual([
        ["count", 1],
        ["title", "initial-updated"],
        ["users", {}],
        ["flags", {}],
        ["settings", { theme: "light" }],
      ]);
      expect({ ...draft }).toEqual({
        count: 1,
        title: "initial-updated",
        users: {},
        flags: {},
        settings: {
          theme: "light",
        },
      });

      Object.assign(draft, {
        count: 2,
        title: "assigned",
      });
    });

    expect(storage.read()).toEqual({
      count: 2,
      title: "assigned",
      users: {},
      flags: {},
      settings: {
        theme: "light",
      },
    });
  });
});
