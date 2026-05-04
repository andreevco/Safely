import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isContainerSlot, type ContainerSlot } from "../src/core/slots";
import { slotFromJson, stripSlot } from "../src/core/slots/slot-json";
import { projection } from "../src/core/versioning/projection";

const sourceSchema = z.object({
  title: z.string(),
  oldName: z.string(),
  metrics: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  profile: z.object({
    name: z.string(),
    email: z.string(),
  }),
  entries: z.record(
    z.string(),
    z.object({
      label: z.string(),
      count: z.number(),
    }),
  ),
});

const targetSchema = z.object({
  title: z.string(),
  created: z.boolean(),
  name: z.string(),
  percentComplete: z.number(),
  profile: z.object({
    displayName: z.string(),
    contact: z.string(),
    active: z.boolean(),
  }),
  entries: z.record(
    z.string(),
    z.object({
      id: z.string(),
      title: z.string(),
      amount: z.number(),
      kind: z.string(),
    }),
  ),
});

const sameNameMapSourceSchema = z.object({
  count: z.number(),
});

const sameNameMapTargetSchema = z.object({
  count: z.number(),
});

type Source = z.output<typeof sourceSchema>;
type Target = z.output<typeof targetSchema>;
type TargetProfile = Target["profile"];
type TargetEntry = Target["entries"][string];

const projectSourceToTarget = projection(sourceSchema, targetSchema, (s) => ({
  title: s.copy(),
  created: s.default(true),
  name: s.from("oldName"),
  percentComplete: s.map("metrics", (metrics) =>
    metrics.total === 0 ? 0 : metrics.completed / metrics.total,
  ),
  profile: s.objectFrom<"profile", TargetProfile>("profile", (profile) => ({
    displayName: profile.from("name"),
    contact: profile.from("email"),
    active: profile.default(true),
  })),
  entries: s.recordFrom<"entries", TargetEntry>(
    "entries",
    (entryId, entry) => ({
      id: entry.default(entryId),
      title: entry.from("label"),
      amount: entry.from("count"),
      kind: entry.default("entry"),
    }),
  ),
}));

const projectSameNameMap = projection(
  sameNameMapSourceSchema,
  sameNameMapTargetSchema,
  (s) => ({
    count: s.map((count) => count + 1),
  }),
);

function slot(value: Source): ContainerSlot {
  const source = slotFromJson(value, 7, "device-1");

  if (!isContainerSlot(source)) {
    throw new Error("Expected source json object to create a container slot");
  }

  return source;
}

describe("projection", () => {
  const sourceValue: Source = {
    title: "Project alpha",
    oldName: "Alpha",
    metrics: {
      completed: 3,
      total: 4,
    },
    profile: {
      name: "Ada",
      email: "ada@example.com",
    },
    entries: {
      first: {
        label: "First entry",
        count: 2,
      },
      second: {
        label: "Second entry",
        count: 5,
      },
    },
  };

  it("creates a new value with a default", () => {
    const projected = projectSourceToTarget(slot(sourceValue));

    expect(stripSlot(projected)).toMatchObject({
      created: true,
    });
  });

  it("renames a field", () => {
    const projected = projectSourceToTarget(slot(sourceValue));

    expect(stripSlot(projected)).toMatchObject({
      name: "Alpha",
    });
  });

  it("computes a new value from two previous values", () => {
    const projected = projectSourceToTarget(slot(sourceValue));

    expect(stripSlot(projected)).toMatchObject({
      percentComplete: 0.75,
    });
  });

  it("computes a same-name value with map", () => {
    const projected = projectSameNameMap(
      slotFromJson({ count: 2 }, 7, "device-1") as ContainerSlot,
    );

    expect(stripSlot(projected)).toEqual({
      count: 3,
    });
    expect(projected.v.count).toMatchObject({
      t: 7,
      a: "device-1",
    });
  });

  it("projects nested objects", () => {
    const projected = projectSourceToTarget(slot(sourceValue));

    expect(stripSlot(projected)).toMatchObject({
      profile: {
        displayName: "Ada",
        contact: "ada@example.com",
        active: true,
      },
    });
  });

  it("projects records", () => {
    const projected = projectSourceToTarget(slot(sourceValue));

    expect(stripSlot(projected)).toMatchObject({
      entries: {
        first: {
          id: "first",
          title: "First entry",
          amount: 2,
          kind: "entry",
        },
        second: {
          id: "second",
          title: "Second entry",
          amount: 5,
          kind: "entry",
        },
      },
    });
  });
});
