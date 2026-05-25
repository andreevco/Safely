import type { ContainerSlot } from '../slots';

export interface SnapshotEncoder {
    encode(root: ContainerSlot): string;
    decode(encodedRoot: string): ContainerSlot;
}
