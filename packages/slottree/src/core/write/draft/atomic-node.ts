import type { DraftCursor } from './cursor';
import type { JsonValue } from '../../json';

export class AtomicDraftNode {
    constructor(protected readonly cursor: DraftCursor) {}

    public get(): unknown {
        return this.cursor.readValue();
    }

    public set(value: JsonValue): void {
        this.cursor.writeValue(value);
        this.cursor.notifyUpdate();
    }

    public isNull(): boolean {
        return this.get() === null;
    }

    public setNull(): void {
        this.set(null);
    }

    public ifPresent(map: (draft: this) => void): boolean {
        if (this.isNull()) {
            return false;
        }

        map(this);
        return true;
    }

    public unwrap(): this {
        if (this.isNull()) {
            throw new Error('Nullable draft value is null');
        }

        return this;
    }

    public orDefault(value: JsonValue): this {
        if (this.isNull()) {
            this.set(value);
        }

        return this;
    }
}
