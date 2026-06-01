import type { ArrayDraftNode } from './array-node';
import { AtomicDraftNode } from './atomic-node';
import type { DraftCursor } from './cursor';
import type { JsonValue } from '../../json';

export type DraftNodeFactory = (cursor: DraftCursor) => ArrayDraftNode;
type RuntimeDraftMap = (input: ArrayDraftNode) => AtomicDraftNode;

export class ObjectDraftNode extends AtomicDraftNode {
    constructor(
        cursor: DraftCursor,
        private readonly createChildNode: DraftNodeFactory
    ) {
        super(cursor);
    }

    public at(key: string): ArrayDraftNode {
        return this.createChildNode(this.cursor.child(key));
    }

    public entry(key: string): ObjectEntryDraftNode {
        return new ObjectEntryDraftNode(key, this, this.at(key));
    }

    public override get(key?: string): unknown {
        if (key !== undefined) {
            return this.at(key).get();
        } else {
            return super.get();
        }
    }

    public set(value: JsonValue): void;
    public set(key: string, value: JsonValue | RuntimeDraftMap): void;
    public set(keyOrValue: string | JsonValue, maybeValue?: JsonValue | RuntimeDraftMap): void {
        if (arguments.length < 2) {
            super.set(keyOrValue);
            return;
        }

        const key = keyOrValue as string;
        const value = maybeValue as JsonValue | RuntimeDraftMap;

        if (typeof value === 'function') {
            const mapped = value(this.at(key)).get();

            if (mapped === undefined) {
                this.cursor.ensureContainer().delete(key);
            } else {
                this.cursor.ensureContainer().set(key, mapped as JsonValue);
            }
        } else {
            this.cursor.ensureContainer().set(key, value);
        }
        this.cursor.notifyUpdate();
    }

    public delete(key: string): void {
        this.cursor.ensureContainer().delete(key);
        this.cursor.notifyUpdate();
    }

    public narrow(guard: (value: unknown) => boolean): ObjectDraftNode | undefined {
        const value = this.get();
        return value !== undefined && guard(value) ? this : undefined;
    }
}

export class ObjectEntryDraftNode {
    constructor(
        public readonly key: string,
        public readonly parent: ObjectDraftNode,
        public readonly draft: ArrayDraftNode
    ) {}

    public get(): unknown {
        return this.draft.get();
    }

    public exists(): boolean {
        return this.get() !== undefined;
    }

    public set(value: JsonValue): void {
        this.parent.set(this.key, value);
    }

    public delete(): void {
        this.parent.delete(this.key);
    }

    public update(map: (draft: unknown) => void): void {
        map(this.unwrap());
    }

    public unwrap(): ArrayDraftNode {
        if (!this.exists()) {
            throw new Error(`Draft entry "${this.key}" does not exist`);
        }

        return this.draft;
    }

    public orDefault(value: JsonValue): ArrayDraftNode {
        if (!this.exists()) {
            this.set(value);
        }

        return this.draft;
    }
}
