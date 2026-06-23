import {
    isContainerSlot,
    isOrderedArraySlot,
    type ContainerSlot,
    type OrderedArraySlot,
    type Slot
} from '../../slots';
import { cloneDeep, stripSlot } from '../../slots/slot-json';

type PatchCursorTarget =
    | {
          kind: 'root';
          slot: ContainerSlot;
      }
    | {
          kind: 'field';
          parent: PatchCursor;
          key: string;
      }
    | {
          kind: 'orderedArrayValue';
          array: PatchCursor;
          itemId: string;
      };

export class PatchCursor {
    private constructor(private readonly target: PatchCursorTarget) {}

    public static root(slot: ContainerSlot): PatchCursor {
        return new PatchCursor({
            kind: 'root',
            slot
        });
    }

    public field(key: string): PatchCursor {
        return new PatchCursor({
            kind: 'field',
            parent: this,
            key
        });
    }

    public orderedArrayValue(itemId: string): PatchCursor {
        return new PatchCursor({
            kind: 'orderedArrayValue',
            array: this,
            itemId
        });
    }

    public readSlot(): Slot | undefined {
        switch (this.target.kind) {
            case 'root':
                return this.target.slot;

            case 'field':
                return this.target.parent.readContainerSlot()?.v[this.target.key];

            case 'orderedArrayValue':
                return this.readOrderedArrayItem()?.v.value;
        }
    }

    public writeSlot(slot: Slot): void {
        switch (this.target.kind) {
            case 'root': {
                const root = this.target.slot;
                const next = expectContainerSlot(slot, 'Root patch slot');
                root.v = next.v;
                root.t = next.t;
                root.a = next.a;
                return;
            }

            case 'field':
                this.target.parent.expectContainerSlot().v[this.target.key] = slot;
                return;

            case 'orderedArrayValue':
                this.expectOrderedArrayItem().v.value = slot;
                return;
        }
    }

    public deleteSlot(): void {
        switch (this.target.kind) {
            case 'root':
                throw new Error('Cannot delete root patch slot');

            case 'field':
                delete this.target.parent.expectContainerSlot().v[this.target.key];
                return;

            case 'orderedArrayValue':
                delete this.target.array.expectOrderedArraySlot().v[this.target.itemId];
                return;
        }
    }

    public readValue(): unknown {
        return cloneDeep(stripSlot(this.readSlot()));
    }

    public readContainerSlot(): ContainerSlot | undefined {
        const slot = this.readSlot();

        return isContainerSlot(slot) ? slot : undefined;
    }

    public expectContainerSlot(): ContainerSlot {
        return expectContainerSlot(this.readSlot(), 'Patch target');
    }

    public readOrderedArraySlot(): OrderedArraySlot | undefined {
        const slot = this.readSlot();

        return isOrderedArraySlot(slot) ? slot : undefined;
    }

    public expectOrderedArraySlot(): OrderedArraySlot {
        const slot = this.readSlot();
        if (!isOrderedArraySlot(slot)) {
            throw new Error('Patch target must be an ordered array slot');
        }

        return slot;
    }

    private readOrderedArrayItem(): ContainerSlot | undefined {
        if (this.target.kind !== 'orderedArrayValue') {
            throw new Error('Patch cursor is not an ordered array value cursor');
        }

        const array = this.target.array.readOrderedArraySlot();
        if (array === undefined) {
            return undefined;
        }

        const item = array.v[this.target.itemId];
        if (item === undefined) {
            return undefined;
        }

        return expectContainerSlot(item, `Ordered array item "${this.target.itemId}"`);
    }

    private expectOrderedArrayItem(): ContainerSlot {
        if (this.target.kind !== 'orderedArrayValue') {
            throw new Error('Patch cursor is not an ordered array value cursor');
        }

        const item = this.readOrderedArrayItem();
        if (item === undefined) {
            throw new Error(`Ordered array item "${this.target.itemId}" does not exist`);
        }

        return item;
    }
}

function expectContainerSlot(slot: Slot | undefined, label: string): ContainerSlot {
    if (!isContainerSlot(slot)) {
        throw new Error(`${label} must be a container slot`);
    }

    return slot;
}
