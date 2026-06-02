import type { PatchCursor } from './cursor';
import type { PatchDraft } from './types';
import type { JsonValue } from '../../json';
import {
    isContainerSlot,
    isOrderedArraySlot,
    isTombstoneSlot,
    type ContainerSlot,
    type Slot
} from '../../slots';
import { orderedArrayLiveIds, slotFromJson, stripSlot } from '../../slots/slot-json';

type PatchMap = (value: unknown) => JsonValue | undefined;
type ItemPatch = (draft: PatchDraftNode) => unknown;

export function createPatchDraft<T>(cursor: PatchCursor): PatchDraft<T> {
    return new PatchDraftNode(cursor) as unknown as PatchDraft<T>;
}

class PatchDraftNode {
    constructor(private readonly cursor: PatchCursor) {}

    public newField(
        path: readonly string[],
        field: string,
        defaultValue: JsonValue
    ): PatchDraftNode {
        const container = this.cursorAt(path).expectContainerSlot();

        assertMissingField(container, field);
        container.v[field] = slotFromJson(defaultValue, 0, '');
        return this;
    }

    public rename(path: readonly string[], from: string, to: string): PatchDraftNode {
        const container = this.cursorAt(path).expectContainerSlot();

        assertMissingField(container, to);

        const slot = container.v[from];
        if (slot !== undefined) {
            container.v[to] = slot;
            delete container.v[from];
        }

        return this;
    }

    public update(path: readonly string[], map: PatchMap): PatchDraftNode {
        const cursor = this.cursorAt(path);
        const current = cursor.readSlot();
        const next = map(stripSlot(current));

        if (next === undefined) {
            cursor.deleteSlot();
            return this;
        }

        cursor.writeSlot(slotFromJsonWithClock(next, current));
        return this;
    }

    public deleteField(path: readonly string[], field: string): PatchDraftNode {
        delete this.cursorAt(path).expectContainerSlot().v[field];
        return this;
    }

    public move(from: readonly string[], to: readonly string[]): PatchDraftNode {
        if (from.length === 0) {
            throw new Error('Cannot move root patch slot');
        }

        if (to.length === 0) {
            throw new Error('Move target path cannot be empty');
        }

        if (isPathPrefix(from, to)) {
            throw new Error('Cannot move a slot into itself');
        }

        const sourceCursor = this.cursorAt(from);
        const source = sourceCursor.readSlot();
        if (source === undefined) {
            throw new Error(`Cannot move missing slot "${formatPath(from)}"`);
        }

        const target = splitFieldPath(to);
        const targetContainer = this.cursorAt(target.path).expectContainerSlot();
        assertMissingField(targetContainer, target.field);

        targetContainer.v[target.field] = source;
        sourceCursor.deleteSlot();
        return this;
    }

    public updateEach(path: readonly string[], map: ItemPatch): PatchDraftNode {
        const cursor = this.cursorAt(path);
        const slot = cursor.readSlot();

        if (slot === undefined || isTombstoneSlot(slot)) {
            return this;
        }

        if (isOrderedArraySlot(slot)) {
            for (const id of orderedArrayLiveIds(slot)) {
                map(createPatchDraftNode(cursor.orderedArrayValue(id)));
            }
            return this;
        }

        if (isContainerSlot(slot)) {
            for (const key of Object.keys(slot.v)) {
                const child = slot.v[key];
                if (child !== undefined && !isTombstoneSlot(child)) {
                    map(createPatchDraftNode(cursor.field(key)));
                }
            }
            return this;
        }

        throw new Error('updateEach target must be an ordered array or record slot');
    }

    public when(path: readonly string[], value: JsonValue, map: ItemPatch): PatchDraftNode {
        const current = this.cursorAt(path).readValue();

        if (current === value) {
            map(this);
        }

        return this;
    }

    private cursorAt(path: readonly string[]): PatchCursor {
        return path.reduce<PatchCursor>((cursor, key) => cursor.field(key), this.cursor);
    }
}

function createPatchDraftNode(cursor: PatchCursor): PatchDraftNode {
    return new PatchDraftNode(cursor);
}

function assertMissingField(container: ContainerSlot, field: string): void {
    if (
        Object.prototype.hasOwnProperty.call(container.v, field) &&
        container.v[field] !== undefined
    ) {
        throw new Error(`Cannot create field "${field}" because it already exists`);
    }
}

function slotFromJsonWithClock(value: JsonValue, current: Slot | undefined): Slot {
    return slotFromJson(value, current?.t ?? 0, current?.a ?? '');
}

function splitFieldPath(path: readonly string[]): { path: readonly string[]; field: string } {
    const field = path[path.length - 1];
    if (field === undefined) {
        throw new Error('Field path cannot be empty');
    }

    return {
        path: path.slice(0, -1),
        field
    };
}

function isPathPrefix(prefix: readonly string[], path: readonly string[]): boolean {
    return prefix.length <= path.length && prefix.every((part, index) => path[index] === part);
}

function formatPath(path: readonly string[]): string {
    return path.join('.');
}
