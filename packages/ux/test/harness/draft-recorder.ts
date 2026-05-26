import { vi } from 'vitest';

export type DraftSlotRecorder = {
    push: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    reorder: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    narrow: ReturnType<typeof vi.fn>;
    orDefault: ReturnType<typeof vi.fn>;
    ifPresent: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    entry: ReturnType<typeof vi.fn>;
    at: ReturnType<typeof vi.fn>;
};

export function createDraftSlot(getValue?: () => unknown): DraftSlotRecorder {
    const slot: DraftSlotRecorder = {
        push: vi.fn(),
        remove: vi.fn(),
        reorder: vi.fn(),
        // `update` records the call but does NOT invoke the inner updater.
        // Tests that want to verify what the updater does should pull the
        // function out of `update.mock.calls[0][1]` and invoke it against
        // their own stub sub-draft.
        update: vi.fn(),
        set: vi.fn(),
        get: vi.fn(() => getValue?.()),
        narrow: vi.fn(() => createDraftSlot()),
        orDefault: vi.fn(() => createDraftSlot()),
        // `ifPresent` is used by code that assumes the slot has a value;
        // for the tests we have, leaving it as a plain recorder is enough.
        ifPresent: vi.fn(),
        delete: vi.fn(),
        entry: vi.fn(() => createDraftSlot()),
        at: vi.fn(() => createDraftSlot())
    };
    return slot;
}

export type DraftRecorder = {
    root: DraftSlotRecorder;
    slots: Map<string, DraftSlotRecorder>;
    at: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
};

export function createDraftRecorder(initial: Record<string, unknown> = {}): DraftRecorder {
    const slots = new Map<string, DraftSlotRecorder>();

    const root = createDraftSlot();

    const at = vi.fn((key: string) => {
        let existing = slots.get(key);
        if (!existing) {
            existing = createDraftSlot(() => initial[key]);
            slots.set(key, existing);
        }
        return existing;
    });

    const set = vi.fn();

    root.at = at;
    root.set = set;

    return { root, slots, at, set };
}
