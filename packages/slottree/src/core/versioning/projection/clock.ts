import { MergeProtocol } from '../../merge-protocol';
import { isRecursiveSlot, type Slot } from '../../slots';

export type SlotClock = {
    t: number;
    a: string;
};

export function createClockTracker(): {
    observe(slot: Slot): void;
    result(): SlotClock | undefined;
} {
    let current: SlotClock | undefined;

    return {
        observe(slot: Slot): void {
            const next = {
                t: slot.t,
                a: slot.a
            };

            if (current === undefined || MergeProtocol.compareClocks(next, current) > 0) {
                current = next;
            }
        },

        result(): SlotClock | undefined {
            return current;
        }
    };
}

export function maxClockInTree(slot: Slot | undefined): SlotClock | undefined {
    if (slot === undefined) {
        return undefined;
    }

    let current = {
        t: slot.t,
        a: slot.a
    };

    if (isRecursiveSlot(slot)) {
        for (const key of Object.keys(slot.v)) {
            const childClock = maxClockInTree(slot.v[key]);

            if (childClock !== undefined && MergeProtocol.compareClocks(childClock, current) > 0) {
                current = childClock;
            }
        }
    }

    return current;
}
