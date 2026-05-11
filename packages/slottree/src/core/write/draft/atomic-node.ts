import type { DraftCursor } from './cursor';

export class AtomicDraftNode {
    constructor(protected readonly cursor: DraftCursor) {}

    public get(): unknown {
        return this.cursor.readValue();
    }
}
