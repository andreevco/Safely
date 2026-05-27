import { decodeCbor } from './decode';
import { encodeCbor } from './encode';
import type { ContainerSlot } from '../../slots';

export class CborEncoder {
    public encode(root: ContainerSlot): Buffer {
        return this.encodeBinary(root);
    }

    public decode(encodedRoot: Buffer): ContainerSlot {
        return this.decodeBinary(encodedRoot);
    }

    public encodeBinary(root: ContainerSlot): Buffer {
        return encodeCbor(root);
    }

    public decodeBinary(data: Buffer): ContainerSlot {
        return decodeCbor(data);
    }
}

export const cborEncoder = new CborEncoder();
