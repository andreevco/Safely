import { ArrayDraftNode } from './array-node';
import { DraftCursor } from './cursor';
import type { Draft } from './types';
import { ObjectDraftNode } from './object-node';
import { JsonStorageSelection } from '../selection';

export type { ArrayDraft, AtomicDraft, Draft, DraftInput, ObjectDraft } from './types';

export function createDraft<T>(selection: JsonStorageSelection, onUpdate: () => void): Draft<T> {
    const createChildNode = (cursor: DraftCursor): ArrayDraftNode => {
        return new ArrayDraftNode(cursor, createChildNode);
    };

    return new ObjectDraftNode(
        DraftCursor.root(selection, onUpdate),
        createChildNode
    ) as unknown as Draft<T>;
}
