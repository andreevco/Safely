import { DraftCursor } from './cursor';
import { ObjectDraftNode, ObjectEntryDraftNode, type DraftNodeFactory } from './object-node';
import type { JsonValue } from '../../json';
import {
    isContainerSlot,
    isJsonObject,
    isOrderedArraySlot,
    isTombstoneSlot,
    ORDERED_ARRAY_ITEM_ID_KEY
} from '../../slots';
import {
    ensureOrderedArraySlot,
    expectOrderedArraySlot,
    insertOrderedArrayItem,
    moveOrderedArrayItem,
    orderedArrayIds,
    orderedArraySlotById,
    orderedArrayValueById,
    pushOrderedArrayItem,
    reorderOrderedArrayItems,
    removeOrderedArrayItem
} from '../../slots/ordered-array-slot';
import {
    createOrderedArrayItemSlot,
    orderedArrayItemOrder,
    orderedArrayItemValue,
    slotFromJson
} from '../../slots/slot-json';
import { selectJsonStorage } from '../selection';

export class ArrayDraftNode extends ObjectDraftNode {
    constructor(
        cursor: DraftCursor,
        private readonly childNodeFactory: DraftNodeFactory
    ) {
        super(cursor, childNodeFactory);
    }

    public list(): readonly unknown[] {
        const value = this.get();

        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new Error('Draft value is not an ordered array');
        }

        return value;
    }

    public ids(): readonly string[] {
        return orderedArrayIds(this.cursor.readSlot());
    }

    public getById(id: string): unknown {
        return orderedArrayValueById(this.cursor.readSlot(), id);
    }

    public override entry(id: string): ObjectEntryDraftNode {
        if (isOrderedArraySlot(this.cursor.readSlot())) {
            return new ArrayEntryDraftNode(id, this);
        }

        return super.entry(id);
    }

    public push(item: JsonValue): void {
        const arraySlot = this.ensureOrderedArraySlot();
        pushOrderedArrayItem(arraySlot, item, this.cursor.timestamp(), this.cursor.author());
        this.cursor.notifyUpdate();
    }

    public insert(index: number, item: JsonValue): void {
        const arraySlot = this.ensureOrderedArraySlot();
        insertOrderedArrayItem(
            arraySlot,
            index,
            item,
            this.cursor.timestamp(),
            this.cursor.author()
        );
        this.cursor.notifyUpdate();
    }

    public move(id: string, index: number): void {
        const arraySlot = this.expectOrderedArraySlot();
        moveOrderedArrayItem(arraySlot, id, index, this.cursor.timestamp(), this.cursor.author());
        this.cursor.notifyUpdate();
    }

    public reorder(ids: readonly string[]): void {
        const arraySlot = this.expectOrderedArraySlot();
        reorderOrderedArrayItems(arraySlot, ids, this.cursor.timestamp(), this.cursor.author());
        this.cursor.notifyUpdate();
    }

    public remove(id: string): void {
        const arraySlot = this.expectOrderedArraySlot();
        removeOrderedArrayItem(arraySlot, id, this.cursor.timestamp(), this.cursor.author());
        this.cursor.notifyUpdate();
    }

    public setById(id: string, value: JsonValue): void {
        if (!isJsonObject(value) || value[ORDERED_ARRAY_ITEM_ID_KEY] !== id) {
            throw new Error(`Ordered array item must have ${ORDERED_ARRAY_ITEM_ID_KEY} "${id}"`);
        }

        const arraySlot = this.ensureOrderedArraySlot();
        const existing = orderedArraySlotById(arraySlot, id);
        if (existing === undefined || isTombstoneSlot(existing)) {
            arraySlot.v[id] = createOrderedArrayItemSlot(
                this.ids().length,
                value,
                this.cursor.timestamp(),
                this.cursor.author()
            );
            this.cursor.notifyUpdate();
            return;
        }

        orderedArrayItemOrder(existing, id);
        if (!isContainerSlot(existing)) {
            throw new Error(`Ordered array item "${id}" must be a container slot`);
        }

        existing.v.value = slotFromJson(value, this.cursor.timestamp(), this.cursor.author());
        this.cursor.notifyUpdate();
    }

    public update(id: string, map: (item: unknown) => void): void {
        map(this.draftById(id));
        this.validateItemId(id);
        this.cursor.notifyUpdate();
    }

    public draftById(id: string): ArrayDraftNode {
        const arraySlot = this.expectOrderedArraySlot();
        const item = orderedArraySlotById(arraySlot, id);
        if (item === undefined || isTombstoneSlot(item)) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        const value = orderedArrayItemValue(item, id);
        if (!isContainerSlot(value)) {
            throw new Error(`Ordered array item "${id}" value must be a container slot`);
        }

        return this.childNodeFactory(
            DraftCursor.fromSelection(
                selectJsonStorage(value, this.cursor.timestamp(), this.cursor.author()),
                () => this.cursor.notifyUpdate()
            )
        );
    }

    private ensureOrderedArraySlot() {
        return ensureOrderedArraySlot(
            this.cursor.readSlot(),
            slot => this.cursor.writeSlot(slot),
            this.cursor.timestamp(),
            this.cursor.author()
        );
    }

    private expectOrderedArraySlot() {
        return expectOrderedArraySlot(this.cursor.readSlot());
    }

    private validateItemId(id: string): void {
        const updated = orderedArrayValueById(this.expectOrderedArraySlot(), id);
        if (!isJsonObject(updated) || updated[ORDERED_ARRAY_ITEM_ID_KEY] !== id) {
            throw new Error(`Updated item id must remain "${id}"`);
        }
    }
}

class ArrayEntryDraftNode extends ObjectEntryDraftNode {
    constructor(key: string, draft: ArrayDraftNode) {
        super(key, draft, draft);
    }

    public override get(): unknown {
        return this.draft.getById(this.key);
    }

    public override unwrap(): ArrayDraftNode {
        if (this.get() === undefined) {
            throw new Error(`Ordered array item "${this.key}" does not exist`);
        }

        return this.draft.draftById(this.key);
    }

    public override set(value: JsonValue): void {
        this.draft.setById(this.key, value);
    }

    public override delete(): void {
        if (this.exists()) {
            this.draft.remove(this.key);
        }
    }

    public override update(map: (draft: unknown) => void): void {
        this.draft.update(this.key, map);
    }

    public override orDefault(value: JsonValue): ArrayDraftNode {
        if (!this.exists()) {
            this.set(value);
        }

        return this.unwrap();
    }
}
