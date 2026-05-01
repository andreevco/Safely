import type { Slot, SlotMap } from "./slots";
import { cloneSlot } from "./slots/slot-json";

export interface MergeStats {
  added: number;
  updated: number;
  kept: number;
  replaced: number;
}

export class MergeProtocol {
  readonly id: string;
  private clock: number;

  constructor(authorId: string) {
    this.id = authorId;
    this.clock = this.wallTime();
  }

  wallTime(): number {
    return Math.floor(Date.now() / 1000);
  }

  tick(): number {
    const wallClockTime = this.wallTime();
    this.clock = Math.max(this.clock, wallClockTime) + 1;
    return this.clock;
  }

  observe(timestamp: number): void {
    if (timestamp > this.clock) {
      this.clock = timestamp;
    }
  }

  observeTree(slot: Slot | undefined): void {
    if (slot === undefined) {
      return;
    }

    this.observe(slot.t);
    if (slot.r === true) {
      for (const key of Object.keys(slot.v)) {
        this.observeTree(slot.v[key]);
      }
    }
  }

  static compareClocks(
    left: Pick<Slot, "t" | "a">,
    right: Pick<Slot, "t" | "a">,
  ): number {
    if (left.t !== right.t) {
      return left.t - right.t;
    }

    if (left.a < right.a) {
      return -1;
    }

    if (left.a > right.a) {
      return 1;
    }

    return 0;
  }

  merge(local: Slot, incoming: Slot): MergeStats {
    const stats: MergeStats = { added: 0, updated: 0, kept: 0, replaced: 0 };
    this.observeTree(incoming);
    this.mergeSlot(local, incoming, stats);
    return stats;
  }

  private mergeSlot(local: Slot, incoming: Slot, stats: MergeStats): void {
    if (
      local.r === true &&
      incoming.r === true &&
      MergeProtocol.compareClocks(local, incoming) === 0
    ) {
      this.mergeContainerValues(local.v, incoming.v, stats);
      stats.kept += 1;
      return;
    }

    if (MergeProtocol.compareClocks(incoming, local) > 0) {
      this.replaceSlot(local, incoming);
      stats.replaced += 1;
      return;
    }

    stats.kept += 1;
  }

  private mergeContainerValues(
    localValues: SlotMap,
    incomingValues: SlotMap,
    stats: MergeStats,
  ): void {
    for (const key of Object.keys(incomingValues)) {
      const incomingValue = incomingValues[key];

      if (incomingValue === undefined) {
        continue;
      }

      const localValue = localValues[key];

      if (localValue === undefined) {
        localValues[key] = cloneSlot(incomingValue);
        stats.added += 1;
        continue;
      }

      this.mergeSlot(localValue, incomingValue, stats);
    }
  }

  private replaceSlot(local: Slot, incoming: Slot): void {
    const localRecord = local as unknown as Record<string, unknown>;

    for (const key of Object.keys(localRecord)) {
      delete localRecord[key];
    }

    Object.assign(localRecord, cloneSlot(incoming));
  }
}
