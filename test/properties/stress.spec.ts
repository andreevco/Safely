import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { z } from "zod";
import { createStorage, StorageVersion } from "../../src";
import { hCons, hNil } from "../../src/core/version";
import { Slot } from "../../src/core/slots";
import { stressVersionList } from "./stress-schema";
import { applyOps, opsArb } from "./ops";

function makeStorage(authorId: string, root?: Slot) {
  return createStorage({
    authorId,
    versions: stressVersionList,
    root: root as any,
  });
}

describe("Basic CRDT properties", () => {
  describe("Idempotence", () => {
    it("merging the same incoming state twice does not change visible state", () => {
      fc.assert(
        fc.property(opsArb, opsArb, (opsA, opsB) => {
          const a = makeStorage("A");
          const b = makeStorage("B");

          applyOps(a, opsA);
          applyOps(b, opsB);

          const incoming = b.export();

          a.merge(incoming);
          const afterOnce = a.get();

          a.merge(incoming);
          const afterTwice = a.get();

          expect(afterTwice).toEqual(afterOnce);
        }),
        {
          numRuns: 1000,
        },
      );
    });

    it("merging the same incoming state twice does not change inner slot tree", () => {
      fc.assert(
        fc.property(opsArb, opsArb, (opsA, opsB) => {
          const a = makeStorage("A");
          const b = makeStorage("B");

          applyOps(a, opsA);
          applyOps(b, opsB);

          const incoming = b.export();

          a.merge(incoming);
          const afterOnce = a.export();

          a.merge(incoming);
          const afterTwice = a.export();

          expect(afterTwice).toEqual(afterOnce);
        }),
        {
          numRuns: 1000,
        },
      );
    });

    it("repeated bidirectional sync is idempotent", () => {
      fc.assert(
        fc.property(opsArb, opsArb, (opsA, opsB) => {
          const a = makeStorage("A");
          const b = makeStorage("B");

          applyOps(a, opsA);
          applyOps(b, opsB);

          a.merge(b.export());
          b.merge(a.export());

          const aAfterFirstSync = a.export();
          const bAfterFirstSync = b.export();

          a.merge(b.export());
          b.merge(a.export());

          expect(a.export()).toEqual(aAfterFirstSync);
          expect(b.export()).toEqual(bAfterFirstSync);

          expect(a.get()).toEqual(b.get());
        }),
        {
          numRuns: 1000,
        },
      );
    });

    it("repeated full mesh sync is idempotent", () => {
      fc.assert(
        fc.property(opsArb, opsArb, opsArb, (opsA, opsB, opsC) => {
          const a = makeStorage("A");
          const b = makeStorage("B");
          const c = makeStorage("C");

          applyOps(a, opsA);
          applyOps(b, opsB);
          applyOps(c, opsC);

          function fullMeshSync() {
            a.merge(b.export());
            a.merge(c.export());

            b.merge(a.export());
            b.merge(c.export());

            c.merge(a.export());
            c.merge(b.export());
          }

          fullMeshSync();

          const aAfterFirst = a.export();
          const bAfterFirst = b.export();
          const cAfterFirst = c.export();

          fullMeshSync();

          expect(a.export()).toEqual(aAfterFirst);
          expect(b.export()).toEqual(bAfterFirst);
          expect(c.export()).toEqual(cAfterFirst);

          expect(a.get()).toEqual(b.get());
          expect(b.get()).toEqual(c.get());
        }),
        {
          numRuns: 1000,
        },
      );
    });
  });

  describe("Commutativity", () => {
    it("merging two states in different order results in the same final state", () => {
      fc.assert(
        fc.property(opsArb, opsArb, (opsA, opsB) => {
          const a = makeStorage("A");
          const b = makeStorage("B");

          applyOps(a, opsA);
          applyOps(b, opsB);

          const aState = a.export();
          const bState = b.export();

          a.merge(bState);
          b.merge(aState);

          expect(a.get()).toEqual(b.get());
        }),
        {
          numRuns: 10000,
        },
      );
    });
  });

  describe("Associativity", () => {
    it("merging multiple states in different groupings results in the same final state", () => {
      fc.assert(
        fc.property(opsArb, opsArb, opsArb, (opsA, opsB, opsC) => {
          const a = makeStorage("A");
          const b = makeStorage("B");
          const c = makeStorage("C");

          applyOps(a, opsA);
          applyOps(b, opsB);
          applyOps(c, opsC);

          const aState = a.export();
          const bState = b.export();
          const cState = c.export();

          // (A merge B) merge C
          a.merge(bState);
          a.merge(cState);

          // A merge (B merge C)
          b.merge(cState);
          b.merge(aState);

          expect(a.get()).toEqual(b.get());
        }),
        {
          numRuns: 5000,
        },
      );
    });
  });
});
