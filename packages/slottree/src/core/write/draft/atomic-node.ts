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
}
