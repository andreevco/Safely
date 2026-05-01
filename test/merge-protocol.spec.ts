import { describe, expect, it } from "vitest";
import { MergeProtocol } from "../src/core/merge-protocol";
import {
  createContainerSlot,
  createOriginContainer,
  createTombstoneSlot,
} from "../src/core/slots";

describe("MergeProtocol", () => {
  it("observes every incoming timestamp before merge decisions hide losing subtrees", () => {
    const protocol = new MergeProtocol("local");
    const hiddenIncomingTimestamp = Math.floor(Date.now() / 1000) + 100_000;

    const local = createOriginContainer({
      record: createTombstoneSlot(hiddenIncomingTimestamp - 1, "local"),
    });

    const incoming = createOriginContainer({
      record: createContainerSlot(1, "remote", {
        child: {
          v: "hidden but observed",
          t: hiddenIncomingTimestamp,
          a: "remote",
        },
      }),
    });

    protocol.merge(local, incoming);

    expect(local.v.record).toMatchObject({
      d: true,
      t: hiddenIncomingTimestamp - 1,
      a: "local",
    });
    expect(protocol.tick()).toBeGreaterThan(hiddenIncomingTimestamp);
  });
});
