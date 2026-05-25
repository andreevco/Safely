import type { ContainerSlot } from '../slots';
import { isContainerSlot } from '../slots';
import type { SnapshotEncoder } from './encoder';
import { validateSlot } from '../slots/slot-validation';

export class JsonEncoder implements SnapshotEncoder {
    public encode(root: ContainerSlot): string {
        return stableStringify(root);
    }

    public decode(encodedRoot: string): ContainerSlot {
        const root: unknown = JSON.parse(encodedRoot);
        validateSlot(root);

        if (!isContainerSlot(root)) {
            throw new Error('Encoded storage root must be a container slot');
        }

        return root;
    }
}

export const jsonEncoder: SnapshotEncoder = new JsonEncoder();

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
        .sort()
        .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(',')}}`;
}
