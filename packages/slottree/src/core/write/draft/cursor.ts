import type { Slot } from '../../slots';
import { cloneDeep, stripSlot } from '../../slots/slot-json';
import { JsonStorageSelection } from '../selection';

type DraftContext = {
    timestamp: number;
    author: string;
    onUpdate: () => void;
};

type DraftCursorTarget =
    | {
          kind: 'root';
          selection: JsonStorageSelection;
      }
    | {
          kind: 'child';
          parent: DraftCursor;
          key: string;
      };

export class DraftCursor {
    private constructor(
        private readonly context: DraftContext,
        private readonly target: DraftCursorTarget
    ) {}

    public static root(selection: JsonStorageSelection, onUpdate: () => void): DraftCursor {
        return new DraftCursor(
            {
                timestamp: selection.currentTimestamp(),
                author: selection.currentAuthor(),
                onUpdate
            },
            {
                kind: 'root',
                selection
            }
        );
    }

    public child(key: string): DraftCursor {
        return new DraftCursor(this.context, {
            kind: 'child',
            parent: this,
            key
        });
    }

    public readSlot(): Slot | undefined {
        if (this.target.kind === 'root') {
            return this.target.selection.containerSlot();
        }

        return this.target.parent.readExistingSelection()?.get(this.target.key);
    }

    public writeSlot(slot: Slot): void {
        if (this.target.kind === 'root') {
            throw new Error('Cannot replace the root draft slot');
        }

        this.target.parent.ensureContainer().setSlot(this.target.key, slot);
    }

    public readExistingSelection(): JsonStorageSelection | undefined {
        if (this.target.kind === 'root') {
            return this.target.selection;
        }

        return this.target.parent.readExistingSelection()?.select(this.target.key);
    }

    public ensureContainer(): JsonStorageSelection {
        if (this.target.kind === 'root') {
            return this.target.selection;
        }

        return this.target.parent.ensureContainer().selectOrCreate(this.target.key);
    }

    public timestamp(): number {
        return this.context.timestamp;
    }

    public author(): string {
        return this.context.author;
    }

    public notifyUpdate(): void {
        this.context.onUpdate();
    }

    public readValue(): unknown {
        return cloneDeep(stripSlot(this.readSlot()));
    }
}
