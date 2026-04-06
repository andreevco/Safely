import * as Y from 'yjs';

export class TransactionError extends Error {
    public readonly causeValue: unknown;

    constructor(message: string, causeValue?: unknown) {
        super(message);
        this.name = 'TransactionError';
        this.causeValue = causeValue;
    }
}

function cloneYDoc(source: Y.Doc): Y.Doc {
    const clone = new Y.Doc(source);

    const fullState = Y.encodeStateAsUpdateV2(source);
    Y.applyUpdateV2(clone, fullState);

    return clone;
}

export function atomicTransaction<T>(doc: Y.Doc, mutator: (draft: Y.Doc) => T): T {
    const draft = cloneYDoc(doc);

    let result: T;
    try {
        result = draft.transact(() => mutator(draft));
    } catch (error) {
        console.error(error);
        throw new TransactionError('Draft transaction failed', error);
    }

    const baseStateVector = Y.encodeStateVector(doc);
    const diff = Y.encodeStateAsUpdateV2(draft, baseStateVector);

    if (diff.byteLength === 0) {
        return result;
    }

    Y.applyUpdateV2(doc, diff);

    return result;
}
