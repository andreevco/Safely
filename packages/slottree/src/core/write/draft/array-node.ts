import { DraftCursor } from './cursor';
import { ObjectDraftNode, type DraftNodeFactory } from './object-node';
import type { JsonValue } from '../../json';
import { isContainerSlot, isJsonObject, ORDERED_ARRAY_ITEM_ID_KEY } from '../../slots';
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
import { orderedArrayItemValue } from '../../slots/slot-json';
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

    public update(id: string, map: (item: unknown) => void): void {
        const arraySlot = this.expectOrderedArraySlot();
        const item = orderedArraySlotById(arraySlot, id);
        if (item === undefined) {
            throw new Error(`Ordered array item "${id}" does not exist`);
        }

        const value = orderedArrayItemValue(item, id);
        if (!isContainerSlot(value)) {
            throw new Error(`Ordered array item "${id}" value must be a container slot`);
        }

        map(
            this.childNodeFactory(
                DraftCursor.fromSelection(
                    selectJsonStorage(value, this.cursor.timestamp(), this.cursor.author()),
                    () => this.cursor.notifyUpdate()
                )
            )
        );

        const updated = orderedArrayValueById(arraySlot, id);
        if (!isJsonObject(updated) || updated[ORDERED_ARRAY_ITEM_ID_KEY] !== id) {
            throw new Error(`Updated item id must remain "${id}"`);
        }

        this.cursor.notifyUpdate();
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
}
